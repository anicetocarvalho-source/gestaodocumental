-- 1. Colunas de fluxo no documento
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS approval_workflow_status text NOT NULL DEFAULT 'nao_iniciado',
  ADD COLUMN IF NOT EXISTS current_approval_step integer NOT NULL DEFAULT 0;

-- 2. Tabela de aprovações de documentos
CREATE TABLE IF NOT EXISTS public.document_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  approver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_by uuid,
  approval_order integer NOT NULL DEFAULT 1,
  status public.approval_status NOT NULL DEFAULT 'pendente',
  comments text,
  decided_at timestamptz,
  organization_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, approver_id, approval_order)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_approvals TO authenticated;
GRANT ALL ON public.document_approvals TO service_role;

ALTER TABLE public.document_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aprovacoes visiveis a envolvidos e gestores"
ON public.document_approvals FOR SELECT TO authenticated
USING (
  approver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR requested_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_id
      AND (d.created_by = auth.uid() OR d.organization_id = public.get_user_org_id(auth.uid()))
  )
);

CREATE POLICY "Gestores e autores definem aprovadores"
ON public.document_approvals FOR INSERT TO authenticated
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['admin','gestor','tecnico']::app_role[])
  AND EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_id
      AND (d.organization_id = public.get_user_org_id(auth.uid()) OR d.created_by = auth.uid())
  )
);

CREATE POLICY "Aprovador regista a sua decisao"
ON public.document_approvals FOR UPDATE TO authenticated
USING (
  approver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[])
)
WITH CHECK (
  approver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[])
);

CREATE POLICY "Gestores removem aprovadores pendentes"
ON public.document_approvals FOR DELETE TO authenticated
USING (
  status = 'pendente'
  AND (
    requested_by = auth.uid()
    OR public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[])
  )
);

CREATE INDEX IF NOT EXISTS document_approvals_document_idx ON public.document_approvals(document_id);
CREATE INDEX IF NOT EXISTS document_approvals_approver_status_idx ON public.document_approvals(approver_id, status);

CREATE TRIGGER update_document_approvals_updated_at
BEFORE UPDATE ON public.document_approvals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_org_id_document_approvals
BEFORE INSERT ON public.document_approvals
FOR EACH ROW EXECUTE FUNCTION public.set_organization_id_from_user();

-- 3. Notificar o aprovador quando lhe é atribuída uma aprovação
CREATE OR REPLACE FUNCTION public.notify_document_approval_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  doc_title text;
  doc_entry text;
  approver_auth_id uuid;
BEGIN
  SELECT title, entry_number INTO doc_title, doc_entry
  FROM public.documents WHERE id = NEW.document_id;

  SELECT user_id INTO approver_auth_id
  FROM public.profiles WHERE id = NEW.approver_id;

  IF approver_auth_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (
      approver_auth_id,
      'Aprovação pendente: ' || COALESCE(doc_entry, ''),
      'O documento "' || COALESCE(doc_title, 'sem título') || '" aguarda a sua aprovação.',
      'info',
      'document',
      NEW.document_id
    );
  END IF;

  UPDATE public.documents
  SET approval_workflow_status = 'em_aprovacao'
  WHERE id = NEW.document_id
    AND approval_workflow_status IN ('nao_iniciado', 'devolvido', 'rejeitado');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_document_approval_created
AFTER INSERT ON public.document_approvals
FOR EACH ROW EXECUTE FUNCTION public.notify_document_approval_request();

-- 4. Actualizar estado do documento e notificar o autor após a decisão
CREATE OR REPLACE FUNCTION public.handle_document_approval_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_approvals integer;
  approved_count integer;
  rejected_count integer;
  returned_count integer;
  new_status text;
  doc_title text;
  doc_entry text;
  doc_author uuid;
  status_label text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.decided_at IS NULL THEN
    NEW.decided_at := now();
  END IF;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'aprovado'),
    COUNT(*) FILTER (WHERE status = 'rejeitado'),
    COUNT(*) FILTER (WHERE status = 'devolvido')
  INTO total_approvals, approved_count, rejected_count, returned_count
  FROM public.document_approvals
  WHERE document_id = NEW.document_id AND id <> NEW.id;

  total_approvals := total_approvals + 1;
  IF NEW.status = 'aprovado' THEN approved_count := approved_count + 1; END IF;
  IF NEW.status = 'rejeitado' THEN rejected_count := rejected_count + 1; END IF;
  IF NEW.status = 'devolvido' THEN returned_count := returned_count + 1; END IF;

  IF rejected_count > 0 THEN
    new_status := 'rejeitado';
  ELSIF returned_count > 0 THEN
    new_status := 'devolvido';
  ELSIF approved_count = total_approvals THEN
    new_status := 'aprovado';
  ELSE
    new_status := 'em_aprovacao';
  END IF;

  UPDATE public.documents
  SET approval_workflow_status = new_status,
      current_approval_step = approved_count,
      status = CASE
        WHEN new_status = 'aprovado' THEN 'validated'
        WHEN new_status = 'rejeitado' THEN 'rejected'
        ELSE status
      END
  WHERE id = NEW.document_id;

  SELECT title, entry_number, created_by INTO doc_title, doc_entry, doc_author
  FROM public.documents WHERE id = NEW.document_id;

  status_label := CASE NEW.status
    WHEN 'aprovado' THEN 'aprovado'
    WHEN 'rejeitado' THEN 'rejeitado'
    WHEN 'devolvido' THEN 'devolvido para revisão'
    ELSE NEW.status::text
  END;

  IF doc_author IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (
      doc_author,
      'Documento ' || status_label || ': ' || COALESCE(doc_entry, ''),
      'O documento "' || COALESCE(doc_title, 'sem título') || '" foi ' || status_label ||
        CASE WHEN NEW.comments IS NOT NULL AND NEW.comments <> '' THEN ' — ' || NEW.comments ELSE '' END,
      CASE NEW.status
        WHEN 'aprovado' THEN 'success'
        WHEN 'rejeitado' THEN 'error'
        ELSE 'warning'
      END,
      'document',
      NEW.document_id
    );
  END IF;

  IF NEW.requested_by IS NOT NULL AND NEW.requested_by <> COALESCE(doc_author, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    INSERT INTO public.notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (
      NEW.requested_by,
      'Documento ' || status_label || ': ' || COALESCE(doc_entry, ''),
      'A aprovação solicitada para "' || COALESCE(doc_title, 'sem título') || '" foi ' || status_label || '.',
      CASE NEW.status
        WHEN 'aprovado' THEN 'success'
        WHEN 'rejeitado' THEN 'error'
        ELSE 'warning'
      END,
      'document',
      NEW.document_id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_document_approval_decision
BEFORE UPDATE ON public.document_approvals
FOR EACH ROW EXECUTE FUNCTION public.handle_document_approval_decision();