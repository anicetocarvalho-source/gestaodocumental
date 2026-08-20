-- 1. Extend document_signatures for verifiable, chained electronic signatures
ALTER TABLE public.document_signatures
  ADD COLUMN IF NOT EXISTS signer_name text,
  ADD COLUMN IF NOT EXISTS signer_role text,
  ADD COLUMN IF NOT EXISTS reason text,
  ADD COLUMN IF NOT EXISTS approval_id uuid REFERENCES public.document_approvals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sequence_order integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS document_hash text,
  ADD COLUMN IF NOT EXISTS previous_hash text,
  ADD COLUMN IF NOT EXISTS signature_hash text,
  ADD COLUMN IF NOT EXISTS organization_id uuid;

CREATE INDEX IF NOT EXISTS document_signatures_document_idx ON public.document_signatures(document_id, sequence_order);

-- 2. Signature status on documents
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS signature_status text NOT NULL DEFAULT 'nao_assinado',
  ADD COLUMN IF NOT EXISTS signed_at timestamptz;

-- 3. Signature gate + hash chain + audit trail
CREATE OR REPLACE FUNCTION public.prepare_document_signature()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  pending_count integer;
  total_approvals integer;
  rejected_count integer;
  last_sig RECORD;
  doc RECORD;
BEGIN
  SELECT * INTO doc FROM public.documents WHERE id = NEW.document_id;
  IF doc IS NULL THEN
    RAISE EXCEPTION 'Documento não encontrado';
  END IF;

  SELECT count(*), count(*) FILTER (WHERE status = 'pendente'), count(*) FILTER (WHERE status IN ('rejeitado','devolvido'))
    INTO total_approvals, pending_count, rejected_count
  FROM public.document_approvals WHERE document_id = NEW.document_id;

  IF total_approvals > 0 AND pending_count > 0 THEN
    RAISE EXCEPTION 'Não é possível assinar: existem etapas de aprovação pendentes';
  END IF;

  IF total_approvals > 0 AND rejected_count > 0 THEN
    RAISE EXCEPTION 'Não é possível assinar: o documento foi rejeitado ou devolvido';
  END IF;

  NEW.organization_id := COALESCE(NEW.organization_id, doc.organization_id);

  SELECT sequence_order, signature_hash INTO last_sig
  FROM public.document_signatures
  WHERE document_id = NEW.document_id
  ORDER BY sequence_order DESC
  LIMIT 1;

  NEW.sequence_order := COALESCE(last_sig.sequence_order, 0) + 1;
  NEW.previous_hash := last_sig.signature_hash;

  NEW.document_hash := encode(digest(
    coalesce(doc.entry_number,'') || '|' || coalesce(doc.title,'') || '|' ||
    coalesce(doc.description,'') || '|' || coalesce(doc.status,'') || '|' ||
    coalesce(doc.updated_at::text,''), 'sha256'), 'hex');

  NEW.signature_hash := encode(digest(
    coalesce(NEW.previous_hash,'') || '|' || NEW.document_hash || '|' ||
    NEW.signer_id::text || '|' || coalesce(NEW.signer_name,'') || '|' ||
    coalesce(NEW.signature_data,'') || '|' || coalesce(NEW.signed_at, now())::text, 'sha256'), 'hex');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prepare_document_signature_trigger ON public.document_signatures;
CREATE TRIGGER prepare_document_signature_trigger
BEFORE INSERT ON public.document_signatures
FOR EACH ROW EXECUTE FUNCTION public.prepare_document_signature();

-- 4. Immutability: block updates and deletes
CREATE OR REPLACE FUNCTION public.block_signature_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RAISE EXCEPTION 'As assinaturas são registos imutáveis e não podem ser alteradas ou eliminadas';
END;
$$;

DROP TRIGGER IF EXISTS block_document_signature_mutation ON public.document_signatures;
CREATE TRIGGER block_document_signature_mutation
BEFORE UPDATE OR DELETE ON public.document_signatures
FOR EACH ROW EXECUTE FUNCTION public.block_signature_mutation();

-- 5. After signature: audit trail + document status + notification
CREATE OR REPLACE FUNCTION public.after_document_signature()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  doc_title text;
  doc_entry text;
  creator uuid;
BEGIN
  SELECT title, entry_number, created_by INTO doc_title, doc_entry, creator
  FROM public.documents WHERE id = NEW.document_id;

  UPDATE public.documents
  SET signature_status = 'assinado',
      signed_at = COALESCE(signed_at, NEW.signed_at)
  WHERE id = NEW.document_id;

  INSERT INTO public.document_audit_log (document_id, action, description, new_values, performed_by)
  VALUES (
    NEW.document_id,
    'signature',
    'Documento assinado electronicamente por ' || coalesce(NEW.signer_name, 'utilizador') ||
      ' (assinatura #' || NEW.sequence_order || ')',
    jsonb_build_object(
      'signature_id', NEW.id,
      'signer_id', NEW.signer_id,
      'signer_name', NEW.signer_name,
      'signer_role', NEW.signer_role,
      'signature_type', NEW.signature_type,
      'sequence_order', NEW.sequence_order,
      'document_hash', NEW.document_hash,
      'previous_hash', NEW.previous_hash,
      'signature_hash', NEW.signature_hash,
      'signed_at', NEW.signed_at
    ),
    auth.uid()
  );

  INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, user_id)
  VALUES ('document_signatures', NEW.id, 'INSERT', NULL, to_jsonb(NEW), auth.uid());

  IF creator IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (
      creator,
      'Documento assinado: ' || coalesce(doc_entry, ''),
      'O documento "' || coalesce(doc_title, '') || '" foi assinado electronicamente por ' ||
        coalesce(NEW.signer_name, 'um utilizador') || '.',
      'success',
      'document',
      NEW.document_id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS after_document_signature_trigger ON public.document_signatures;
CREATE TRIGGER after_document_signature_trigger
AFTER INSERT ON public.document_signatures
FOR EACH ROW EXECUTE FUNCTION public.after_document_signature();

-- 6. Public verification helper (recomputes the chain)
CREATE OR REPLACE FUNCTION public.verify_document_signatures(_document_id uuid)
RETURNS TABLE(signature_id uuid, sequence_order integer, signer_name text, signed_at timestamptz, is_chain_valid boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  prev text := NULL;
  rec RECORD;
  recomputed text;
BEGIN
  FOR rec IN
    SELECT * FROM public.document_signatures
    WHERE document_id = _document_id
    ORDER BY sequence_order ASC
  LOOP
    recomputed := encode(digest(
      coalesce(prev,'') || '|' || coalesce(rec.document_hash,'') || '|' ||
      rec.signer_id::text || '|' || coalesce(rec.signer_name,'') || '|' ||
      coalesce(rec.signature_data,'') || '|' || rec.signed_at::text, 'sha256'), 'hex');

    signature_id := rec.id;
    sequence_order := rec.sequence_order;
    signer_name := rec.signer_name;
    signed_at := rec.signed_at;
    is_chain_valid := (recomputed = rec.signature_hash) AND (coalesce(prev,'') = coalesce(rec.previous_hash,''));
    prev := rec.signature_hash;
    RETURN NEXT;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_document_signatures(uuid) TO authenticated;