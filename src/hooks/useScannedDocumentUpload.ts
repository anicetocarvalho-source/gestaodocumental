import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UploadScannedDocumentInput {
  batchId: string;
  file: File;
  title?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface UploadMultipleDocumentsInput {
  batchId: string;
  files: File[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

// Generate document number
const generateDocumentNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SCAN-${year}${month}${day}-${random}`;
};

// Upload single scanned document
export function useUploadScannedDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ batchId, file, title, priority }: UploadScannedDocumentInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilizador não autenticado');

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${batchId}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('scanned-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error('Erro ao carregar ficheiro: ' + uploadError.message);
      }

      // Create scanned document record
      const documentNumber = generateDocumentNumber();
      const { data, error } = await supabase
        .from('scanned_documents')
        .insert({
          batch_id: batchId,
          document_number: documentNumber,
          title: title || file.name.replace(/\.[^/.]+$/, ''),
          priority: priority || 'normal',
          page_count: 1, // Will be updated after processing
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          status: 'pending',
          operator_id: null,
        })
        .select()
        .single();

      if (error) {
        // If document creation fails, try to delete the uploaded file
        await supabase.storage.from('scanned-documents').remove([filePath]);
        console.error('Error creating document record:', error);
        throw new Error('Erro ao criar registo do documento: ' + error.message);
      }

      // Update batch total_pages
      const { data: batchData } = await supabase
        .from('digitization_batches')
        .select('total_pages')
        .eq('id', batchId)
        .single();

      if (batchData) {
        await supabase
          .from('digitization_batches')
          .update({ total_pages: batchData.total_pages + 1 })
          .eq('id', batchId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scanned-documents'] });
      queryClient.invalidateQueries({ queryKey: ['digitization-batches'] });
      queryClient.invalidateQueries({ queryKey: ['digitization-stats'] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Upload multiple documents at once
export function useUploadMultipleDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ batchId, files, priority }: UploadMultipleDocumentsInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilizador não autenticado');

      const results: { success: number; failed: number; errors: string[] } = {
        success: 0,
        failed: 0,
        errors: [],
      };

      for (const file of files) {
        try {
          // Generate unique file path
          const fileExt = file.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `${batchId}/${fileName}`;

          // Upload file to storage
          const { error: uploadError } = await supabase.storage
            .from('scanned-documents')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            results.failed++;
            results.errors.push(`${file.name}: ${uploadError.message}`);
            continue;
          }

          // Create scanned document record
          const documentNumber = generateDocumentNumber();
          const { error } = await supabase
            .from('scanned_documents')
            .insert({
              batch_id: batchId,
              document_number: documentNumber,
              title: file.name.replace(/\.[^/.]+$/, ''),
              priority: priority || 'normal',
              page_count: 1,
              file_path: filePath,
              file_size: file.size,
              mime_type: file.type,
              status: 'pending',
              operator_id: null,
            });

          if (error) {
            await supabase.storage.from('scanned-documents').remove([filePath]);
            results.failed++;
            results.errors.push(`${file.name}: ${error.message}`);
            continue;
          }

          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push(`${file.name}: Erro desconhecido`);
        }
      }

      // Update batch total_pages
      const { data: batch } = await supabase
        .from('digitization_batches')
        .select('total_pages')
        .eq('id', batchId)
        .single();

      if (batch) {
        await supabase
          .from('digitization_batches')
          .update({ total_pages: batch.total_pages + results.success })
          .eq('id', batchId);
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['scanned-documents'] });
      queryClient.invalidateQueries({ queryKey: ['digitization-batches'] });
      queryClient.invalidateQueries({ queryKey: ['digitization-stats'] });

      if (results.success > 0 && results.failed === 0) {
        toast.success(`${results.success} documento(s) carregado(s) com sucesso`);
      } else if (results.success > 0 && results.failed > 0) {
        toast.warning(`${results.success} sucesso, ${results.failed} falha(s)`);
      } else {
        toast.error('Erro ao carregar documentos');
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Get signed URL for viewing a scanned document
export async function getScannedDocumentUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('scanned-documents')
    .createSignedUrl(filePath, 3600); // 1 hour

  if (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

// Download scanned document
export function useDownloadScannedDocument() {
  return useMutation({
    mutationFn: async ({ filePath, fileName }: { filePath: string; fileName: string }) => {
      const { data, error } = await supabase.storage
        .from('scanned-documents')
        .download(filePath);

      if (error) {
        throw new Error('Erro ao transferir ficheiro: ' + error.message);
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    },
    onSuccess: () => {
      toast.success('Ficheiro transferido');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Delete scanned document with its file
export function useDeleteScannedDocumentWithFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string | null }) => {
      // Delete file from storage if exists
      if (filePath) {
        await supabase.storage
          .from('scanned-documents')
          .remove([filePath]);
      }

      // Delete document record
      const { error } = await supabase
        .from('scanned_documents')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error('Erro ao remover documento: ' + error.message);
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scanned-documents'] });
      queryClient.invalidateQueries({ queryKey: ['digitization-batches'] });
      queryClient.invalidateQueries({ queryKey: ['digitization-stats'] });
      toast.success('Documento removido');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
