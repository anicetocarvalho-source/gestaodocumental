
-- Tabela para modelos de processos
CREATE TABLE public.process_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Geral',
  process_type TEXT NOT NULL DEFAULT 'Administrativo',
  estimated_days INTEGER NOT NULL DEFAULT 5,
  tags TEXT[] DEFAULT '{}',
  steps JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para roles/permissões customizadas
CREATE TABLE public.custom_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  user_count INTEGER NOT NULL DEFAULT 0,
  permissions JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para regras SLA
CREATE TABLE public.sla_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  process_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  duration_hours INTEGER NOT NULL DEFAULT 48,
  warning_threshold INTEGER NOT NULL DEFAULT 75,
  critical_threshold INTEGER NOT NULL DEFAULT 90,
  escalation_rules JSONB DEFAULT '[]',
  alert_config JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para configuração de prioridades SLA
CREATE TABLE public.sla_priorities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  priority_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  time_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  initial_escalation_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.process_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_priorities ENABLE ROW LEVEL SECURITY;

-- Políticas para process_templates
CREATE POLICY "Todos podem ver modelos activos" ON public.process_templates
  FOR SELECT USING (is_active = true OR auth.uid() = created_by);

CREATE POLICY "Admin e gestor podem criar modelos" ON public.process_templates
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'gestor'))
  );

CREATE POLICY "Admin e gestor podem actualizar modelos" ON public.process_templates
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'gestor'))
  );

CREATE POLICY "Admin pode eliminar modelos" ON public.process_templates
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Políticas para custom_roles
CREATE POLICY "Todos podem ver roles" ON public.custom_roles
  FOR SELECT USING (true);

CREATE POLICY "Apenas admin pode gerir roles" ON public.custom_roles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Políticas para sla_rules
CREATE POLICY "Todos podem ver regras SLA" ON public.sla_rules
  FOR SELECT USING (true);

CREATE POLICY "Admin e gestor podem gerir SLA" ON public.sla_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'gestor'))
  );

-- Políticas para sla_priorities
CREATE POLICY "Todos podem ver prioridades" ON public.sla_priorities
  FOR SELECT USING (true);

CREATE POLICY "Admin pode gerir prioridades" ON public.sla_priorities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Triggers para updated_at
CREATE TRIGGER update_process_templates_updated_at
  BEFORE UPDATE ON public.process_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_roles_updated_at
  BEFORE UPDATE ON public.custom_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sla_rules_updated_at
  BEFORE UPDATE ON public.sla_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sla_priorities_updated_at
  BEFORE UPDATE ON public.sla_priorities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir roles de sistema padrão
INSERT INTO public.custom_roles (name, description, is_system, permissions) VALUES
  ('Administrador', 'Acesso total ao sistema, gestão de utilizadores e configurações', true, 
   '{"documents":{"view":true,"create":true,"edit":true,"delete":true,"approve":true},"processes":{"view":true,"create":true,"edit":true,"delete":true,"approve":true},"users":{"view":true,"create":true,"edit":true,"delete":true},"settings":{"view":true,"edit":true},"reports":{"view":true,"export":true},"archive":{"view":true,"destroy":true}}'::jsonb),
  ('Gestor', 'Aprovação de processos, gestão de documentos e relatórios', true,
   '{"documents":{"view":true,"create":true,"edit":true,"delete":false,"approve":true},"processes":{"view":true,"create":true,"edit":true,"delete":false,"approve":true},"users":{"view":true,"create":false,"edit":false,"delete":false},"settings":{"view":true,"edit":false},"reports":{"view":true,"export":true},"archive":{"view":true,"destroy":false}}'::jsonb),
  ('Técnico', 'Criação e tramitação de documentos e processos', true,
   '{"documents":{"view":true,"create":true,"edit":true,"delete":false,"approve":false},"processes":{"view":true,"create":true,"edit":true,"delete":false,"approve":false},"users":{"view":false,"create":false,"edit":false,"delete":false},"settings":{"view":false,"edit":false},"reports":{"view":true,"export":false},"archive":{"view":true,"destroy":false}}'::jsonb),
  ('Consulta', 'Visualização de documentos e processos (apenas leitura)', true,
   '{"documents":{"view":true,"create":false,"edit":false,"delete":false,"approve":false},"processes":{"view":true,"create":false,"edit":false,"delete":false,"approve":false},"users":{"view":false,"create":false,"edit":false,"delete":false},"settings":{"view":false,"edit":false},"reports":{"view":true,"export":false},"archive":{"view":true,"destroy":false}}'::jsonb);

-- Inserir prioridades SLA padrão
INSERT INTO public.sla_priorities (priority_key, label, color, time_multiplier, initial_escalation_role) VALUES
  ('urgente', 'Urgente', '#ef4444', 0.5, 'director'),
  ('alta', 'Alta', '#f97316', 0.75, 'chefe_departamento'),
  ('normal', 'Normal', '#3b82f6', 1.0, 'tecnico_senior'),
  ('baixa', 'Baixa', '#22c55e', 1.5, NULL);
