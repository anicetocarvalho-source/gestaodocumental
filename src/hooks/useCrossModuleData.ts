import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para buscar processos vinculados a um documento
 */
export function useDocumentLinkedProcesses(documentId: string | undefined) {
  return useQuery({
    queryKey: ['document-linked-processes', documentId],
    queryFn: async () => {
      if (!documentId) return [];

      const { data, error } = await supabase
        .from('process_documents')
        .select(`
          id,
          description,
          created_at,
          process:processes(
            id,
            process_number,
            subject,
            status,
            priority,
            deadline,
            current_unit:organizational_units!processes_current_unit_id_fkey(id, name)
          )
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || [])
        .filter(d => d.process)
        .map(d => ({
          linkId: d.id,
          description: d.description,
          linkedAt: d.created_at,
          ...d.process as {
            id: string;
            process_number: string;
            subject: string;
            status: string;
            priority: string;
            deadline: string | null;
            current_unit: { id: string; name: string } | null;
          },
        }));
    },
    enabled: !!documentId,
  });
}

/**
 * Hook para buscar despachos vinculados a um documento
 */
export function useDocumentLinkedDispatches(documentId: string | undefined) {
  return useQuery({
    queryKey: ['document-linked-dispatches', documentId],
    queryFn: async () => {
      if (!documentId) return [];

      const { data, error } = await supabase
        .from('dispatch_documents')
        .select(`
          id,
          created_at,
          dispatch:dispatches(
            id,
            dispatch_number,
            subject,
            status,
            priority,
            dispatch_type,
            created_at,
            origin_unit:organizational_units!origin_unit_id(id, name)
          )
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || [])
        .filter(d => d.dispatch)
        .map(d => ({
          linkId: d.id,
          linkedAt: d.created_at,
          ...d.dispatch as {
            id: string;
            dispatch_number: string;
            subject: string;
            status: string;
            priority: string;
            dispatch_type: string;
            created_at: string;
            origin_unit: { id: string; name: string } | null;
          },
        }));
    },
    enabled: !!documentId,
  });
}

/**
 * Hook para buscar documentos vinculados a um despacho
 */
export function useDispatchLinkedDocuments(dispatchId: string | undefined) {
  return useQuery({
    queryKey: ['dispatch-linked-documents', dispatchId],
    queryFn: async () => {
      if (!dispatchId) return [];

      const { data, error } = await supabase
        .from('dispatch_documents')
        .select(`
          id,
          file_name,
          file_path,
          file_size,
          mime_type,
          created_at,
          document:documents(
            id,
            entry_number,
            title,
            status,
            priority,
            entry_date
          )
        `)
        .eq('dispatch_id', dispatchId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(d => ({
        linkId: d.id,
        fileName: d.file_name,
        filePath: d.file_path,
        fileSize: d.file_size,
        mimeType: d.mime_type,
        linkedAt: d.created_at,
        document: d.document as {
          id: string;
          entry_number: string;
          title: string;
          status: string;
          priority: string;
          entry_date: string;
        } | null,
      }));
    },
    enabled: !!dispatchId,
  });
}
