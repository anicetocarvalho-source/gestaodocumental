import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GedDocument {
  id: string;
  batch_id: string;
  document_number: string;
  title: string | null;
  status: string;
  priority: string;
  page_count: number;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  ocr_text: string | null;
  ocr_confidence: number | null;
  barcode: string | null;
  qr_code: string | null;
  keywords: string[] | null;
  document_date: string | null;
  reference_number: string | null;
  sender: string | null;
  classification_id: string | null;
  index_fields: Record<string, string> | null;
  indexed_at: string | null;
  created_at: string;
  batch?: { id: string; batch_number: string; name: string } | null;
  classification?: { id: string; code: string; name: string } | null;
}

export interface GedSearchFilters {
  term?: string;
  code?: string;
  status?: string;
  classificationId?: string;
  indexed?: 'all' | 'indexed' | 'pending';
  dateFrom?: string;
  dateTo?: string;
}

const SELECT = `
  *,
  batch:digitization_batches(id, batch_number, name),
  classification:classification_codes(id, code, name)
`;

export function useGedSearch(filters: GedSearchFilters) {
  return useQuery({
    queryKey: ['ged-search', filters],
    queryFn: async () => {
      let query = supabase
        .from('scanned_documents')
        .select(SELECT)
        .order('created_at', { ascending: false })
        .limit(200);

      const code = filters.code?.trim();
      if (code) {
        query = query.or(
          `barcode.eq.${code},qr_code.eq.${code},document_number.eq.${code},reference_number.eq.${code}`
        );
      }

      const term = filters.term?.trim();
      if (term) {
        const safe = term.replace(/[,%()]/g, ' ');
        query = query.or(
          `title.ilike.%${safe}%,ocr_text.ilike.%${safe}%,sender.ilike.%${safe}%,reference_number.ilike.%${safe}%,document_number.ilike.%${safe}%`
        );
      }

      if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
      if (filters.classificationId && filters.classificationId !== 'all') {
        query = query.eq('classification_id', filters.classificationId);
      }
      if (filters.indexed === 'indexed') query = query.not('indexed_at', 'is', null);
      if (filters.indexed === 'pending') query = query.is('indexed_at', null);
      if (filters.dateFrom) query = query.gte('document_date', filters.dateFrom);
      if (filters.dateTo) query = query.lte('document_date', filters.dateTo);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as GedDocument[];
    },
  });
}

export interface IndexDocumentInput {
  id: string;
  title?: string | null;
  barcode?: string | null;
  qr_code?: string | null;
  keywords?: string[];
  document_date?: string | null;
  reference_number?: string | null;
  sender?: string | null;
  classification_id?: string | null;
  index_fields?: Record<string, string>;
}

export function useIndexDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...fields }: IndexDocumentInput) => {
      const { data: { user } } = await supabase.auth.getUser();

      const payload = {
        ...fields,
        barcode: fields.barcode?.trim() || null,
        qr_code: fields.qr_code?.trim() || null,
        reference_number: fields.reference_number?.trim() || null,
        sender: fields.sender?.trim() || null,
        document_date: fields.document_date || null,
        classification_id: fields.classification_id || null,
        indexed_at: new Date().toISOString(),
        indexed_by: user?.id ?? null,
      };

      const { data, error } = await supabase
        .from('scanned_documents')
        .update(payload)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        if (error.code === '23505') throw new Error('Já existe um documento com esse código de barras/QR.');
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ged-search'] });
      queryClient.invalidateQueries({ queryKey: ['scanned-documents'] });
      toast.success('Indexação guardada');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useGedStats() {
  return useQuery({
    queryKey: ['ged-stats'],
    queryFn: async () => {
      const [total, indexed, withCode, ocr] = await Promise.all([
        supabase.from('scanned_documents').select('id', { count: 'exact', head: true }),
        supabase.from('scanned_documents').select('id', { count: 'exact', head: true }).not('indexed_at', 'is', null),
        supabase.from('scanned_documents').select('id', { count: 'exact', head: true }).not('barcode', 'is', null),
        supabase.from('scanned_documents').select('id', { count: 'exact', head: true }).not('ocr_text', 'is', null),
      ]);

      return {
        total: total.count ?? 0,
        indexed: indexed.count ?? 0,
        withCode: withCode.count ?? 0,
        withOcr: ocr.count ?? 0,
      };
    },
  });
}

export async function getGedDocumentUrl(filePath: string) {
  const { data, error } = await supabase.storage
    .from('scanned-documents')
    .createSignedUrl(filePath, 3600);
  if (error) return null;
  return data.signedUrl;
}

export interface GedDashboardSlice {
  key: string;
  label: string;
  count: number;
}

export interface GedDashboard {
  total: number;
  byStatus: GedDashboardSlice[];
  byClassification: GedDashboardSlice[];
  byCategory: GedDashboardSlice[];
  byIndexing: GedDashboardSlice[];
  byMonth: GedDashboardSlice[];
}

export const GED_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  ocr_processing: 'Em OCR',
  quality_review: 'Em revisão',
  completed: 'Concluído',
  error: 'Erro',
};

export function useGedDashboard() {
  return useQuery({
    queryKey: ['ged-dashboard'],
    queryFn: async (): Promise<GedDashboard> => {
      const { data, error } = await supabase
        .from('scanned_documents')
        .select(`
          id, status, created_at, indexed_at, classification_id,
          classification:classification_codes(id, code, name),
          batch:digitization_batches(id, name, batch_number)
        `)
        .order('created_at', { ascending: false })
        .limit(2000);

      if (error) throw error;

      const rows = (data ?? []) as unknown as Array<{
        id: string;
        status: string;
        created_at: string;
        indexed_at: string | null;
        classification_id: string | null;
        classification: { id: string; code: string; name: string } | null;
        batch: { id: string; name: string; batch_number: string } | null;
      }>;

      const tally = (
        items: Array<{ key: string; label: string }>,
      ): GedDashboardSlice[] => {
        const map = new Map<string, GedDashboardSlice>();
        items.forEach(({ key, label }) => {
          const current = map.get(key);
          if (current) current.count += 1;
          else map.set(key, { key, label, count: 1 });
        });
        return [...map.values()].sort((a, b) => b.count - a.count);
      };

      const byStatus = tally(
        rows.map((r) => ({ key: r.status, label: GED_STATUS_LABELS[r.status] ?? r.status })),
      );

      const byClassification = tally(
        rows.map((r) => ({
          key: r.classification?.id ?? 'none',
          label: r.classification ? `${r.classification.code} — ${r.classification.name}` : 'Sem classificação',
        })),
      ).slice(0, 8);

      const byCategory = tally(
        rows.map((r) => ({
          key: r.batch?.id ?? 'none',
          label: r.batch ? r.batch.name || r.batch.batch_number : 'Sem lote',
        })),
      ).slice(0, 8);

      const indexedCount = rows.filter((r) => r.indexed_at).length;
      const byIndexing: GedDashboardSlice[] = [
        { key: 'indexed', label: 'Indexados', count: indexedCount },
        { key: 'pending', label: 'Por indexar', count: rows.length - indexedCount },
      ];

      const monthMap = new Map<string, number>();
      rows.forEach((r) => {
        const d = new Date(r.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
      });
      const byMonth = [...monthMap.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6)
        .map(([key, count]) => ({ key, label: key, count }));

      return { total: rows.length, byStatus, byClassification, byCategory, byIndexing, byMonth };
    },
    staleTime: 30000,
  });
}
