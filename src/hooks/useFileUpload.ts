import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DocumentFile } from '@/types/database';

interface UploadFileInput {
  documentId: string;
  file: File;
  isMainFile?: boolean;
}

export function useUploadDocumentFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, file, isMainFile = false }: UploadFileInput): Promise<DocumentFile> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilizador não autenticado');

      // 1. Fazer upload do ficheiro para o storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 2. Obter versão actual (para versionamento)
      const { data: existingFiles } = await supabase
        .from('document_files')
        .select('version')
        .eq('document_id', documentId)
        .eq('file_name', file.name)
        .order('version', { ascending: false })
        .limit(1);

      const newVersion = existingFiles && existingFiles.length > 0 
        ? existingFiles[0].version + 1 
        : 1;

      // 3. Se é ficheiro principal, remover flag dos outros
      if (isMainFile) {
        await supabase
          .from('document_files')
          .update({ is_main_file: false })
          .eq('document_id', documentId)
          .eq('is_main_file', true);
      }

      // 4. Registar na tabela de ficheiros
      const { data, error } = await supabase
        .from('document_files')
        .insert({
          document_id: documentId,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type,
          is_main_file: isMainFile,
          version: newVersion,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      return data as DocumentFile;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document', variables.documentId] });
    },
  });
}

export function useDeleteDocumentFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId, filePath, documentId }: { 
      fileId: string; 
      filePath: string; 
      documentId: string;
    }) => {
      // 1. Eliminar do storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // 2. Eliminar registo da base de dados
      const { error } = await supabase
        .from('document_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      return documentId;
    },
    onSuccess: (documentId) => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    },
  });
}

export function useGetFileUrl() {
  return async (filePath: string): Promise<string> => {
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600); // 1 hora

    if (!data?.signedUrl) throw new Error('Não foi possível obter URL do ficheiro');

    return data.signedUrl;
  };
}

export function useDownloadFile() {
  return useMutation({
    mutationFn: async ({ filePath, fileName }: { filePath: string; fileName: string }) => {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      // Criar download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });
}
