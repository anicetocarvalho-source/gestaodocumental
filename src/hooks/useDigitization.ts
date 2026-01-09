import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface DigitizationBatch {
  id: string;
  batch_number: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'paused';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  total_pages: number;
  processed_pages: number;
  error_pages: number;
  operator_id: string | null;
  classification_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  operator?: {
    id: string;
    full_name: string;
  } | null;
  classification?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface ScannedDocument {
  id: string;
  batch_id: string;
  document_number: string;
  title: string | null;
  status: 'pending' | 'scanning' | 'ocr_processing' | 'quality_review' | 'completed' | 'error' | 'rejected';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  page_count: number;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  ocr_text: string | null;
  ocr_confidence: number | null;
  detected_language: string | null;
  quality_score: number | null;
  quality_flags: unknown[] | null;
  metadata: unknown | null;
  operator_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  operator?: {
    id: string;
    full_name: string;
  } | null;
  batch?: {
    id: string;
    batch_number: string;
    name: string;
  } | null;
}

export interface CreateBatchInput {
  name: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  operator_id?: string | null;
  classification_id?: string | null;
  notes?: string | null;
}

export interface CreateScannedDocumentInput {
  batch_id: string;
  document_number: string;
  title?: string | null;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  page_count?: number;
  file_path?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
}

// Fetch batches
export function useDigitizationBatches(statusFilter?: string) {
  return useQuery({
    queryKey: ['digitization-batches', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('digitization_batches')
        .select(`
          *,
          operator:profiles!digitization_batches_operator_id_fkey(id, full_name),
          classification:classification_codes(id, code, name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching batches:', error);
        throw error;
      }

      return data as DigitizationBatch[];
    },
  });
}

// Fetch single batch with documents
export function useDigitizationBatch(batchId: string | undefined) {
  return useQuery({
    queryKey: ['digitization-batch', batchId],
    queryFn: async () => {
      if (!batchId) return null;

      const { data, error } = await supabase
        .from('digitization_batches')
        .select(`
          *,
          operator:profiles!digitization_batches_operator_id_fkey(id, full_name),
          classification:classification_codes(id, code, name)
        `)
        .eq('id', batchId)
        .single();

      if (error) {
        console.error('Error fetching batch:', error);
        throw error;
      }

      return data as DigitizationBatch;
    },
    enabled: !!batchId,
  });
}

// Fetch scanned documents
export function useScannedDocuments(batchId?: string, statusFilter?: string) {
  return useQuery({
    queryKey: ['scanned-documents', batchId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('scanned_documents')
        .select(`
          *,
          operator:profiles!scanned_documents_operator_id_fkey(id, full_name),
          batch:digitization_batches(id, batch_number, name)
        `)
        .order('created_at', { ascending: false });

      if (batchId) {
        query = query.eq('batch_id', batchId);
      }

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching scanned documents:', error);
        throw error;
      }

      return data as ScannedDocument[];
    },
  });
}

// Get stats
export function useDigitizationStats() {
  return useQuery({
    queryKey: ['digitization-stats'],
    queryFn: async () => {
      const { data: documents, error } = await supabase
        .from('scanned_documents')
        .select('status');

      if (error) {
        console.error('Error fetching stats:', error);
        throw error;
      }

      const stats = {
        pending: 0,
        scanning: 0,
        ocr_processing: 0,
        quality_review: 0,
        completed: 0,
        error: 0,
        rejected: 0,
        approved: 0,
        total: documents?.length || 0,
      };

      documents?.forEach(doc => {
        const status = doc.status as keyof typeof stats;
        if (status in stats) {
          stats[status]++;
        }
      });

      return stats;
    },
  });
}

// Get stats per batch
export interface BatchDocumentStats {
  batchId: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  processing: number;
}

export function useBatchDocumentStats() {
  const queryClient = useQueryClient();

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('scanned-documents-stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scanned_documents'
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          
          // Show toast notifications for status changes
          if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
            const newStatus = (payload.new as { status?: string }).status;
            const oldStatus = (payload.old as { status?: string }).status;
            const docNumber = (payload.new as { document_number?: string }).document_number;
            
            if (newStatus !== oldStatus) {
              if (newStatus === 'approved') {
                toast.success(`Documento ${docNumber || ''} aprovado`, {
                  description: 'Um documento foi aprovado por outro utilizador'
                });
              } else if (newStatus === 'rejected') {
                toast.error(`Documento ${docNumber || ''} rejeitado`, {
                  description: 'Um documento foi rejeitado por outro utilizador'
                });
              }
            }
          }
          
          // Invalidate queries to refresh stats
          queryClient.invalidateQueries({ queryKey: ['batch-document-stats'] });
          queryClient.invalidateQueries({ queryKey: ['digitization-stats'] });
          queryClient.invalidateQueries({ queryKey: ['scanned-documents'] });
          queryClient.invalidateQueries({ queryKey: ['batch-documents'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['batch-document-stats'],
    queryFn: async () => {
      const { data: documents, error } = await supabase
        .from('scanned_documents')
        .select('batch_id, status');

      if (error) {
        console.error('Error fetching batch stats:', error);
        throw error;
      }

      const statsMap = new Map<string, BatchDocumentStats>();

      documents?.forEach(doc => {
        if (!doc.batch_id) return;
        
        if (!statsMap.has(doc.batch_id)) {
          statsMap.set(doc.batch_id, {
            batchId: doc.batch_id,
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            processing: 0,
          });
        }
        
        const batchStats = statsMap.get(doc.batch_id)!;
        batchStats.total++;
        
        switch (doc.status) {
          case 'approved':
          case 'completed':
            batchStats.approved++;
            break;
          case 'rejected':
            batchStats.rejected++;
            break;
          case 'scanning':
          case 'ocr_processing':
          case 'quality_review':
            batchStats.processing++;
            break;
          default:
            batchStats.pending++;
        }
      });

      return Object.fromEntries(statsMap);
    },
  });
}

// Create batch
export function useCreateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBatchInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('digitization_batches')
        .insert({
          name: input.name,
          priority: input.priority || 'normal',
          operator_id: input.operator_id,
          classification_id: input.classification_id,
          notes: input.notes,
          created_by: user?.id,
          batch_number: '', // Will be generated by trigger
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating batch:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitization-batches'] });
      queryClient.invalidateQueries({ queryKey: ['digitization-stats'] });
      toast.success('Lote criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar lote: ' + error.message);
    },
  });
}

// Update batch
export function useUpdateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DigitizationBatch> & { id: string }) => {
      const { data, error } = await supabase
        .from('digitization_batches')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating batch:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['digitization-batches'] });
      queryClient.invalidateQueries({ queryKey: ['digitization-batch', data.id] });
      queryClient.invalidateQueries({ queryKey: ['digitization-stats'] });
      toast.success('Lote atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar lote: ' + error.message);
    },
  });
}

// Create scanned document
export function useCreateScannedDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateScannedDocumentInput) => {
      const { data, error } = await supabase
        .from('scanned_documents')
        .insert({
          batch_id: input.batch_id,
          document_number: input.document_number,
          title: input.title,
          priority: input.priority || 'normal',
          page_count: input.page_count || 1,
          file_path: input.file_path,
          file_size: input.file_size,
          mime_type: input.mime_type,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating scanned document:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scanned-documents'] });
      queryClient.invalidateQueries({ queryKey: ['digitization-batches'] });
      queryClient.invalidateQueries({ queryKey: ['digitization-stats'] });
      // Update batch total_pages
      supabase
        .from('digitization_batches')
        .select('total_pages')
        .eq('id', data.batch_id)
        .single()
        .then(({ data: batch }) => {
          if (batch) {
            supabase
              .from('digitization_batches')
              .update({ total_pages: batch.total_pages + 1 })
              .eq('id', data.batch_id);
          }
        });
      toast.success('Documento adicionado ao lote');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar documento: ' + error.message);
    },
  });
}

// Update scanned document
export function useUpdateScannedDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      // Remove nested objects that aren't part of the table
      const { operator, batch, ...cleanUpdates } = updates as Record<string, unknown>;
      
      const { data, error } = await supabase
        .from('scanned_documents')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating scanned document:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scanned-documents'] });
      queryClient.invalidateQueries({ queryKey: ['digitization-stats'] });
      toast.success('Documento atualizado');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar documento: ' + error.message);
    },
  });
}

// Delete scanned document
export function useDeleteScannedDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scanned_documents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting scanned document:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scanned-documents'] });
      queryClient.invalidateQueries({ queryKey: ['digitization-stats'] });
      toast.success('Documento removido');
    },
    onError: (error) => {
      toast.error('Erro ao remover documento: ' + error.message);
    },
  });
}
