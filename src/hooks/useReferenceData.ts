import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  OrganizationalUnit, 
  ClassificationCode, 
  DocumentType,
  Profile
} from '@/types/database';

// =============================================
// Unidades Orgânicas
// =============================================

export function useOrganizationalUnits(options?: { activeOnly?: boolean }) {
  return useQuery({
    queryKey: ['organizational-units', options],
    queryFn: async (): Promise<OrganizationalUnit[]> => {
      let query = supabase
        .from('organizational_units')
        .select('*')
        .order('level')
        .order('name');

      if (options?.activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as OrganizationalUnit[];
    },
  });
}

export function useOrganizationalUnit(id: string | undefined) {
  return useQuery({
    queryKey: ['organizational-unit', id],
    queryFn: async (): Promise<OrganizationalUnit | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('organizational_units')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      return data as OrganizationalUnit;
    },
    enabled: !!id,
  });
}

// =============================================
// Tipos de Documento
// =============================================

export function useDocumentTypes(options?: { activeOnly?: boolean }) {
  return useQuery({
    queryKey: ['document-types', options],
    queryFn: async (): Promise<DocumentType[]> => {
      let query = supabase
        .from('document_types')
        .select('*')
        .order('name');

      if (options?.activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as DocumentType[];
    },
  });
}

// =============================================
// Plano de Classificação
// =============================================

export function useClassificationCodes(options?: { 
  activeOnly?: boolean;
  level?: number;
  parentId?: string;
}) {
  return useQuery({
    queryKey: ['classification-codes', options],
    queryFn: async (): Promise<ClassificationCode[]> => {
      let query = supabase
        .from('classification_codes')
        .select('*')
        .order('code');

      if (options?.activeOnly) {
        query = query.eq('is_active', true);
      }

      if (options?.level) {
        query = query.eq('level', options.level);
      }

      if (options?.parentId) {
        query = query.eq('parent_id', options.parentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as ClassificationCode[];
    },
  });
}

export function useClassificationTree() {
  return useQuery({
    queryKey: ['classification-tree'],
    queryFn: async (): Promise<ClassificationCode[]> => {
      const { data, error } = await supabase
        .from('classification_codes')
        .select('*')
        .eq('is_active', true)
        .order('code');

      if (error) throw error;

      // Construir árvore hierárquica
      const codes = data as ClassificationCode[];
      const codeMap = new Map<string, ClassificationCode>();
      const roots: ClassificationCode[] = [];

      // Primeiro passo: criar mapa
      codes.forEach(code => {
        codeMap.set(code.id, { ...code, children: [] });
      });

      // Segundo passo: construir árvore
      codes.forEach(code => {
        const node = codeMap.get(code.id)!;
        if (code.parent_id) {
          const parent = codeMap.get(code.parent_id);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(node);
          }
        } else {
          roots.push(node);
        }
      });

      return roots;
    },
  });
}

// =============================================
// Perfis / Utilizadores
// =============================================

export function useProfiles(options?: { activeOnly?: boolean; unitId?: string }) {
  return useQuery({
    queryKey: ['profiles', options],
    queryFn: async (): Promise<Profile[]> => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (options?.activeOnly) {
        query = query.eq('is_active', true);
      }

      if (options?.unitId) {
        query = query.eq('unit_id', options.unitId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as Profile[];
    },
  });
}

export function useProfilesByUnit(unitId: string | undefined) {
  return useQuery({
    queryKey: ['profiles-by-unit', unitId],
    queryFn: async (): Promise<Profile[]> => {
      if (!unitId) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('unit_id', unitId)
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;

      return data as Profile[];
    },
    enabled: !!unitId,
  });
}
