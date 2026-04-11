
-- Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  domain TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  storage_quota_mb INTEGER NOT NULL DEFAULT 5120,
  storage_used_mb INTEGER NOT NULL DEFAULT 0,
  max_users INTEGER NOT NULL DEFAULT 50,
  plan TEXT NOT NULL DEFAULT 'standard',
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admin can view organizations"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admin can insert organizations"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admin can update organizations"
  ON public.organizations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admin can delete organizations"
  ON public.organizations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Platform settings table
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type TEXT NOT NULL DEFAULT 'text',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admin can view platform settings"
  ON public.platform_settings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admin can insert platform settings"
  ON public.platform_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admin can update platform settings"
  ON public.platform_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admin can delete platform settings"
  ON public.platform_settings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial platform settings
INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, description) VALUES
  ('max_upload_size_mb', '50', 'number', 'Tamanho máximo de upload de ficheiros em MB'),
  ('maintenance_mode', 'false', 'boolean', 'Modo de manutenção da plataforma'),
  ('platform_version', '1.0.0', 'text', 'Versão actual da plataforma'),
  ('default_storage_quota_mb', '5120', 'number', 'Quota de armazenamento padrão para novas organizações em MB'),
  ('max_users_per_org', '50', 'number', 'Número máximo de utilizadores por organização'),
  ('session_timeout_minutes', '480', 'number', 'Timeout de sessão em minutos'),
  ('allow_self_registration', 'false', 'boolean', 'Permitir registo autónomo de utilizadores');
