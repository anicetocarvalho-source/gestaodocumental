-- Tabela para configurações da organização
CREATE TABLE public.organization_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type TEXT NOT NULL DEFAULT 'text',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configurações padrão
INSERT INTO public.organization_settings (setting_key, setting_value, setting_type, description) VALUES
  ('org_name', 'MINAGRIF', 'text', 'Nome da organização'),
  ('org_code', 'MINAGRIF-001', 'text', 'Código da organização'),
  ('admin_email', 'admin@minagrif.gov.mz', 'email', 'Email do administrador'),
  ('phone', '+258 21 000 000', 'text', 'Telefone da organização'),
  ('address', 'Av. 25 de Setembro, Maputo, Moçambique', 'text', 'Morada da organização'),
  ('language', 'pt-PT', 'text', 'Idioma padrão'),
  ('timezone', 'Africa/Maputo', 'text', 'Fuso horário'),
  ('date_format', 'DD/MM/YYYY', 'text', 'Formato de data'),
  ('currency', 'MZN', 'text', 'Moeda'),
  ('auto_save_drafts', 'false', 'boolean', 'Guardar rascunhos automaticamente'),
  ('dark_mode', 'false', 'boolean', 'Modo escuro'),
  ('compact_view', 'false', 'boolean', 'Vista compacta');

-- Tabela para modelos de documentos
CREATE TABLE public.document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'geral',
  content TEXT,
  file_path TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para conexões de integrações
CREATE TABLE public.integration_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  config JSONB DEFAULT '{}',
  connected_at TIMESTAMP WITH TIME ZONE,
  connected_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir integrações padrão
INSERT INTO public.integration_connections (integration_name, display_name, description, icon) VALUES
  ('microsoft365', 'Microsoft 365', 'Sincronizar com Outlook, OneDrive e SharePoint', 'M'),
  ('google_workspace', 'Google Workspace', 'Integrar com Gmail, Drive e Calendar', 'G'),
  ('sigof', 'SIGOF', 'Sistema de Gestão Orçamental e Financeira', 'S'),
  ('esistafe', 'eSISTAFE', 'Sistema de Administração Financeira do Estado', 'E'),
  ('portal_gov', 'Portal do Governo', 'Integração com portal gov.mz', 'P');

-- Enable RLS
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;

-- Políticas para organization_settings (apenas admins podem modificar, todos podem ler)
CREATE POLICY "Todos podem ver configurações" ON public.organization_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins podem modificar configurações" ON public.organization_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Políticas para document_templates
CREATE POLICY "Todos podem ver templates activos" ON public.document_templates
  FOR SELECT TO authenticated USING (is_active = true OR public.has_any_role(auth.uid(), ARRAY['admin', 'gestor']::app_role[]));

CREATE POLICY "Admins e gestores podem criar templates" ON public.document_templates
  FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'gestor']::app_role[]));

CREATE POLICY "Admins e gestores podem modificar templates" ON public.document_templates
  FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'gestor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'gestor']::app_role[]));

CREATE POLICY "Admins podem eliminar templates" ON public.document_templates
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para integration_connections
CREATE POLICY "Todos podem ver integrações" ON public.integration_connections
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins podem modificar integrações" ON public.integration_connections
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Triggers para updated_at
CREATE TRIGGER update_organization_settings_updated_at
  BEFORE UPDATE ON public.organization_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON public.document_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integration_connections_updated_at
  BEFORE UPDATE ON public.integration_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();