-- ========================================
-- SISTEMA DE PROCESSOS - MINAGRIF
-- ========================================

-- 1. Enum para estado do processo
CREATE TYPE public.process_status AS ENUM (
  'rascunho',
  'em_andamento',
  'aguardando_aprovacao',
  'aprovado',
  'rejeitado',
  'suspenso',
  'arquivado',
  'concluido'
);

-- 2. Enum para prioridade
CREATE TYPE public.process_priority AS ENUM (
  'baixa',
  'normal',
  'alta',
  'urgente'
);

-- 3. Tabela de tipos de processo
CREATE TABLE public.process_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  default_sla_days INTEGER DEFAULT 30,
  requires_approval BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabela principal de processos
CREATE TABLE public.processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_number TEXT NOT NULL UNIQUE,
  process_type_id UUID REFERENCES public.process_types(id),
  subject TEXT NOT NULL,
  description TEXT,
  status public.process_status NOT NULL DEFAULT 'rascunho',
  priority public.process_priority NOT NULL DEFAULT 'normal',
  
  -- Origem e solicitante
  origin TEXT DEFAULT 'interno', -- 'interno' ou 'externo'
  requester_name TEXT,
  requester_unit_id UUID REFERENCES public.organizational_units(id),
  external_requester_info JSONB, -- Para requisitantes externos
  
  -- Unidade e responsável actual
  current_unit_id UUID REFERENCES public.organizational_units(id),
  responsible_user_id UUID REFERENCES public.profiles(id),
  
  -- Prazos e SLA
  sla_days INTEGER,
  deadline TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metadados
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tabela de etapas do workflow
CREATE TABLE public.process_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  stage_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  unit_id UUID REFERENCES public.organizational_units(id),
  assigned_user_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'current', 'completed', 'skipped'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  duration_days INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Tabela de movimentações de processo
CREATE TABLE public.process_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'despacho', 'encaminhamento', 'parecer', 'aprovacao', 'rejeicao', 'devolucao'
  from_unit_id UUID REFERENCES public.organizational_units(id),
  to_unit_id UUID REFERENCES public.organizational_units(id),
  from_user_id UUID REFERENCES public.profiles(id),
  to_user_id UUID REFERENCES public.profiles(id),
  dispatch_text TEXT,
  notes TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Tabela de pareceres e despachos
CREATE TABLE public.process_opinions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  opinion_number TEXT NOT NULL,
  opinion_type TEXT NOT NULL, -- 'parecer_tecnico', 'parecer_juridico', 'despacho', 'informacao'
  author_id UUID REFERENCES public.profiles(id),
  unit_id UUID REFERENCES public.organizational_units(id),
  summary TEXT NOT NULL,
  content TEXT,
  decision TEXT, -- 'favoravel', 'desfavoravel', 'com_ressalvas', 'encaminhado'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Tabela de comentários de processo
CREATE TABLE public.process_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Tabela de documentos vinculados a processos
CREATE TABLE public.process_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  -- Para ficheiros directos (não documentos do sistema)
  file_name TEXT,
  file_path TEXT,
  file_size INTEGER,
  mime_type TEXT,
  -- Metadados
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Tabela de log de auditoria de processos
CREATE TABLE public.process_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT,
  old_values JSONB,
  new_values JSONB,
  performed_by UUID,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- ÍNDICES
-- ========================================
CREATE INDEX idx_processes_status ON public.processes(status);
CREATE INDEX idx_processes_priority ON public.processes(priority);
CREATE INDEX idx_processes_current_unit ON public.processes(current_unit_id);
CREATE INDEX idx_processes_responsible ON public.processes(responsible_user_id);
CREATE INDEX idx_processes_deadline ON public.processes(deadline);
CREATE INDEX idx_processes_created_by ON public.processes(created_by);
CREATE INDEX idx_process_stages_process ON public.process_stages(process_id);
CREATE INDEX idx_process_movements_process ON public.process_movements(process_id);
CREATE INDEX idx_process_documents_process ON public.process_documents(process_id);
CREATE INDEX idx_process_comments_process ON public.process_comments(process_id);

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger para updated_at
CREATE TRIGGER update_processes_updated_at
  BEFORE UPDATE ON public.processes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_process_types_updated_at
  BEFORE UPDATE ON public.process_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_process_comments_updated_at
  BEFORE UPDATE ON public.process_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar número de processo
CREATE OR REPLACE FUNCTION public.generate_process_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  year_part TEXT;
  sequence_number INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(process_number FROM 'PROC-' || year_part || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO sequence_number
  FROM public.processes
  WHERE process_number LIKE 'PROC-' || year_part || '-%';
  
  NEW.process_number := 'PROC-' || year_part || '-' || LPAD(sequence_number::TEXT, 6, '0');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_process_number_trigger
  BEFORE INSERT ON public.processes
  FOR EACH ROW
  WHEN (NEW.process_number IS NULL OR NEW.process_number = '')
  EXECUTE FUNCTION public.generate_process_number();

-- Função para auditoria de processos
CREATE OR REPLACE FUNCTION public.audit_process_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.process_audit_log (process_id, action, description, new_values, performed_by)
    VALUES (NEW.id, 'create', 'Processo criado', to_jsonb(NEW), NEW.created_by);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.process_audit_log (process_id, action, description, old_values, new_values, performed_by)
      VALUES (NEW.id, 'status_change', 'Estado alterado de ' || OLD.status || ' para ' || NEW.status, 
              jsonb_build_object('status', OLD.status), 
              jsonb_build_object('status', NEW.status), 
              NEW.created_by);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER audit_process_changes_trigger
  AFTER INSERT OR UPDATE ON public.processes
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_process_changes();

-- Função para criar notificação de movimentação de processo
CREATE OR REPLACE FUNCTION public.create_process_movement_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  proc_subject TEXT;
  proc_number TEXT;
  to_user_auth_id UUID;
  action_label TEXT;
BEGIN
  -- Obter info do processo
  SELECT subject, process_number INTO proc_subject, proc_number
  FROM public.processes
  WHERE id = NEW.process_id;

  -- Label da acção
  action_label := CASE NEW.action_type
    WHEN 'despacho' THEN 'Despacho'
    WHEN 'encaminhamento' THEN 'Encaminhamento'
    WHEN 'parecer' THEN 'Parecer'
    WHEN 'aprovacao' THEN 'Aprovação'
    WHEN 'rejeicao' THEN 'Rejeição'
    WHEN 'devolucao' THEN 'Devolução'
    ELSE NEW.action_type
  END;

  -- Se há utilizador específico, notificar
  IF NEW.to_user_id IS NOT NULL THEN
    SELECT user_id INTO to_user_auth_id
    FROM public.profiles
    WHERE id = NEW.to_user_id;

    IF to_user_auth_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, reference_type, reference_id)
      VALUES (
        to_user_auth_id,
        action_label || ': ' || proc_number,
        'Processo "' || proc_subject || '" foi encaminhado para si.',
        'movement',
        'process',
        NEW.process_id
      );
    END IF;
  ELSE
    -- Notificar todos na unidade destino
    INSERT INTO public.notifications (user_id, title, message, type, reference_type, reference_id)
    SELECT 
      p.user_id,
      action_label || ': ' || proc_number,
      'Processo "' || proc_subject || '" foi encaminhado para a sua unidade.',
      'movement',
      'process',
      NEW.process_id
    FROM public.profiles p
    WHERE p.unit_id = NEW.to_unit_id
      AND p.is_active = true;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER create_process_movement_notification_trigger
  AFTER INSERT ON public.process_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.create_process_movement_notification();

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================
ALTER TABLE public.process_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_opinions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas para process_types (apenas leitura para autenticados)
CREATE POLICY "Authenticated users can view process types"
  ON public.process_types FOR SELECT
  TO authenticated
  USING (true);

-- Políticas para processes
CREATE POLICY "Users can view processes in their unit or assigned to them"
  ON public.processes FOR SELECT
  TO authenticated
  USING (
    current_unit_id IN (SELECT unit_id FROM profiles WHERE user_id = auth.uid())
    OR responsible_user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can create processes"
  ON public.processes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update processes they are responsible for"
  ON public.processes FOR UPDATE
  TO authenticated
  USING (
    responsible_user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR created_by = auth.uid()
  );

-- Políticas para process_stages
CREATE POLICY "Users can view process stages"
  ON public.process_stages FOR SELECT
  TO authenticated
  USING (
    process_id IN (SELECT id FROM processes WHERE 
      current_unit_id IN (SELECT unit_id FROM profiles WHERE user_id = auth.uid())
      OR responsible_user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage process stages"
  ON public.process_stages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para process_movements
CREATE POLICY "Users can view process movements"
  ON public.process_movements FOR SELECT
  TO authenticated
  USING (
    process_id IN (SELECT id FROM processes WHERE 
      current_unit_id IN (SELECT unit_id FROM profiles WHERE user_id = auth.uid())
      OR responsible_user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create process movements"
  ON public.process_movements FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Políticas para process_opinions
CREATE POLICY "Users can view process opinions"
  ON public.process_opinions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create process opinions"
  ON public.process_opinions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Políticas para process_comments
CREATE POLICY "Users can view process comments"
  ON public.process_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create process comments"
  ON public.process_comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own comments"
  ON public.process_comments FOR UPDATE
  TO authenticated
  USING (author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Políticas para process_documents
CREATE POLICY "Users can view process documents"
  ON public.process_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can add process documents"
  ON public.process_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Políticas para process_audit_log
CREATE POLICY "Users can view process audit log"
  ON public.process_audit_log FOR SELECT
  TO authenticated
  USING (true);

-- ========================================
-- DADOS INICIAIS
-- ========================================
INSERT INTO public.process_types (code, name, description, default_sla_days, requires_approval) VALUES
  ('LIC', 'Licitação', 'Processos de licitação e compras públicas', 60, true),
  ('CTR', 'Contratação', 'Contratação de serviços e pessoal', 45, true),
  ('REN', 'Renovação', 'Renovação de contratos existentes', 30, true),
  ('SOL', 'Solicitação', 'Solicitações gerais', 15, false),
  ('PAR', 'Parecer', 'Pareceres técnicos e jurídicos', 20, false),
  ('CNV', 'Convénio', 'Convénios e parcerias', 90, true),
  ('AUD', 'Auditoria', 'Processos de auditoria interna', 60, true),
  ('REC', 'Recurso', 'Recursos administrativos', 30, true),
  ('DEN', 'Denúncia', 'Denúncias e reclamações', 30, true),
  ('CON', 'Consulta', 'Consultas e informações', 10, false);

-- Habilitar realtime para processos
ALTER PUBLICATION supabase_realtime ADD TABLE public.processes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.process_movements;