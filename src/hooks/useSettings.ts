import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// =============================================
// Organization Settings
// =============================================

export interface OrganizationSettings {
  org_name: string;
  org_code: string;
  admin_email: string;
  phone: string;
  address: string;
  language: string;
  timezone: string;
  date_format: string;
  currency: string;
  auto_save_drafts: boolean;
  dark_mode: boolean;
  compact_view: boolean;
}

export function useOrganizationSettings() {
  return useQuery({
    queryKey: ['organization-settings'],
    queryFn: async (): Promise<OrganizationSettings> => {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('setting_key, setting_value, setting_type');

      if (error) throw error;

      const settings: Record<string, string | boolean> = {};
      (data || []).forEach((item: { setting_key: string; setting_value: string | null; setting_type: string }) => {
        if (item.setting_type === 'boolean') {
          settings[item.setting_key] = item.setting_value === 'true';
        } else {
          settings[item.setting_key] = item.setting_value || '';
        }
      });

      return {
        org_name: (settings.org_name as string) || '',
        org_code: (settings.org_code as string) || '',
        admin_email: (settings.admin_email as string) || '',
        phone: (settings.phone as string) || '',
        address: (settings.address as string) || '',
        language: (settings.language as string) || 'pt-PT',
        timezone: (settings.timezone as string) || 'Africa/Maputo',
        date_format: (settings.date_format as string) || 'DD/MM/YYYY',
        currency: (settings.currency as string) || 'MZN',
        auto_save_drafts: settings.auto_save_drafts as boolean || false,
        dark_mode: settings.dark_mode as boolean || false,
        compact_view: settings.compact_view as boolean || false,
      };
    },
  });
}

export function useSaveOrganizationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<OrganizationSettings>) => {
      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: String(value),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('organization_settings')
          .update({ setting_value: update.setting_value })
          .eq('setting_key', update.setting_key);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-settings'] });
    },
  });
}

// =============================================
// Document Templates
// =============================================

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  content: string | null;
  file_path: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useDocumentTemplates() {
  return useQuery({
    queryKey: ['document-templates'],
    queryFn: async (): Promise<DocumentTemplate[]> => {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateDocumentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Omit<DocumentTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('document_templates')
        .insert({
          ...template,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
    },
  });
}

export function useUpdateDocumentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DocumentTemplate> & { id: string }) => {
      const { error } = await supabase
        .from('document_templates')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
    },
  });
}

export function useDeleteDocumentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('document_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
    },
  });
}

// =============================================
// Integration Connections
// =============================================

export interface IntegrationConnection {
  id: string;
  integration_name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  is_connected: boolean;
  config: unknown;
  connected_at: string | null;
  connected_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useIntegrationConnections() {
  return useQuery({
    queryKey: ['integration-connections'],
    queryFn: async (): Promise<IntegrationConnection[]> => {
      const { data, error } = await supabase
        .from('integration_connections')
        .select('*')
        .order('display_name');

      if (error) throw error;
      return data || [];
    },
  });
}

export function useToggleIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, connect }: { id: string; connect: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('integration_connections')
        .update({
          is_connected: connect,
          connected_at: connect ? new Date().toISOString() : null,
          connected_by: connect ? user?.id : null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-connections'] });
    },
  });
}
