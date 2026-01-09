import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClassificationNode {
  id: string;
  code: string;
  name: string;
  description: string | null;
  level: number;
  parent_id: string | null;
  retention_years: number | null;
  final_destination: string | null;
  is_active: boolean;
  children: ClassificationNode[];
  documentCount?: number;
}

export interface RepositoryDocument {
  id: string;
  title: string;
  entry_number: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  classification_code?: {
    id: string;
    code: string;
    name: string;
  } | null;
  document_type?: {
    id: string;
    code: string;
    name: string;
  } | null;
  created_by_profile?: {
    full_name: string;
  } | null;
  files_count: number;
}

export interface RepositoryStats {
  totalDocuments: number;
  totalClassifications: number;
  documentsThisMonth: number;
  pendingDocuments: number;
  byClassification: { name: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

// Hook to fetch all classification codes as a tree
export function useClassificationTree() {
  return useQuery({
    queryKey: ["classification-tree"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classification_codes")
        .select("*")
        .eq("is_active", true)
        .order("code");

      if (error) throw error;

      // Build tree structure
      const nodeMap = new Map<string, ClassificationNode>();
      const roots: ClassificationNode[] = [];

      // First pass: create all nodes
      data.forEach((item) => {
        nodeMap.set(item.id, {
          ...item,
          children: [],
        });
      });

      // Second pass: build parent-child relationships
      data.forEach((item) => {
        const node = nodeMap.get(item.id)!;
        if (item.parent_id && nodeMap.has(item.parent_id)) {
          nodeMap.get(item.parent_id)!.children.push(node);
        } else if (!item.parent_id) {
          roots.push(node);
        }
      });

      return roots;
    },
  });
}

// Hook to fetch documents by classification
export function useDocumentsByClassification(classificationId: string | null) {
  return useQuery({
    queryKey: ["documents-by-classification", classificationId],
    queryFn: async () => {
      if (!classificationId) return [];

      const { data, error } = await supabase
        .from("documents")
        .select(`
          id,
          title,
          entry_number,
          status,
          priority,
          created_at,
          updated_at,
          classification_code:classification_codes(id, code, name),
          document_type:document_types(id, code, name),
          created_by_profile:profiles!documents_created_by_fkey(full_name),
          files:document_files(id)
        `)
        .eq("classification_id", classificationId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((doc) => ({
        id: doc.id,
        title: doc.title,
        entry_number: doc.entry_number,
        status: doc.status,
        priority: doc.priority,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        classification_code: Array.isArray(doc.classification_code)
          ? doc.classification_code[0] || null
          : doc.classification_code,
        document_type: Array.isArray(doc.document_type)
          ? doc.document_type[0] || null
          : doc.document_type,
        created_by_profile: Array.isArray(doc.created_by_profile)
          ? doc.created_by_profile[0] || null
          : doc.created_by_profile,
        files_count: doc.files?.length || 0,
      })) as RepositoryDocument[];
    },
    enabled: !!classificationId,
  });
}

// Hook to fetch all documents with optional filters
export function useRepositoryDocuments(filters?: {
  search?: string;
  classificationId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["repository-documents", filters],
    queryFn: async () => {
      let query = supabase
        .from("documents")
        .select(`
          id,
          title,
          entry_number,
          status,
          priority,
          created_at,
          updated_at,
          classification_code:classification_codes(id, code, name),
          document_type:document_types(id, code, name),
          created_by_profile:profiles!documents_created_by_fkey(full_name),
          files:document_files(id)
        `)
        .order("created_at", { ascending: false });

      if (filters?.classificationId) {
        query = query.eq("classification_id", filters.classificationId);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      let result = (data || []).map((doc) => ({
        id: doc.id,
        title: doc.title,
        entry_number: doc.entry_number,
        status: doc.status,
        priority: doc.priority,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        classification_code: Array.isArray(doc.classification_code)
          ? doc.classification_code[0] || null
          : doc.classification_code,
        document_type: Array.isArray(doc.document_type)
          ? doc.document_type[0] || null
          : doc.document_type,
        created_by_profile: Array.isArray(doc.created_by_profile)
          ? doc.created_by_profile[0] || null
          : doc.created_by_profile,
        files_count: doc.files?.length || 0,
      })) as RepositoryDocument[];

      // Client-side search filtering
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter(
          (doc) =>
            doc.title.toLowerCase().includes(searchLower) ||
            doc.entry_number.toLowerCase().includes(searchLower) ||
            doc.classification_code?.name?.toLowerCase().includes(searchLower) ||
            doc.document_type?.name?.toLowerCase().includes(searchLower)
        );
      }

      return result;
    },
  });
}

// Hook to fetch repository statistics
export function useRepositoryStats() {
  return useQuery({
    queryKey: ["repository-stats"],
    queryFn: async () => {
      // Fetch total documents
      const { count: totalDocuments } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true });

      // Fetch total classifications
      const { count: totalClassifications } = await supabase
        .from("classification_codes")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Fetch documents this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: documentsThisMonth } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());

      // Fetch pending documents
      const { count: pendingDocuments } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "in_progress"]);

      // Fetch documents grouped by classification (top 5)
      const { data: classificationDocs } = await supabase
        .from("documents")
        .select("classification_id");

      const { data: classifications } = await supabase
        .from("classification_codes")
        .select("id, name");

      const classificationMap = new Map(
        (classifications || []).map((c) => [c.id, c.name])
      );

      const classificationCounts: Record<string, number> = {};
      (classificationDocs || []).forEach((doc) => {
        const name = doc.classification_id
          ? classificationMap.get(doc.classification_id) || "Sem classificação"
          : "Sem classificação";
        classificationCounts[name] = (classificationCounts[name] || 0) + 1;
      });

      const byClassificationArray = Object.entries(classificationCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Fetch documents grouped by status
      const { data: byStatus } = await supabase
        .from("documents")
        .select("status");

      const statusCounts: Record<string, number> = {};
      (byStatus || []).forEach((doc) => {
        statusCounts[doc.status] = (statusCounts[doc.status] || 0) + 1;
      });

      const byStatusArray = Object.entries(statusCounts).map(
        ([status, count]) => ({ status, count })
      );

      return {
        totalDocuments: totalDocuments || 0,
        totalClassifications: totalClassifications || 0,
        documentsThisMonth: documentsThisMonth || 0,
        pendingDocuments: pendingDocuments || 0,
        byClassification: byClassificationArray,
        byStatus: byStatusArray,
      } as RepositoryStats;
    },
  });
}

// Hook to count documents per classification
export function useDocumentCountByClassification() {
  return useQuery({
    queryKey: ["document-count-by-classification"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("classification_id");

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data || []).forEach((doc) => {
        if (doc.classification_id) {
          counts[doc.classification_id] =
            (counts[doc.classification_id] || 0) + 1;
        }
      });

      return counts;
    },
  });
}
