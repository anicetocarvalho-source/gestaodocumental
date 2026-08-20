REVOKE EXECUTE ON FUNCTION public.verify_document_signatures(uuid) FROM PUBLIC, anon;

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
  doc_org uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária';
  END IF;

  SELECT organization_id INTO doc_org FROM public.documents WHERE id = _document_id;
  IF doc_org IS DISTINCT FROM public.get_user_org_id(auth.uid()) THEN
    RAISE EXCEPTION 'Sem permissão para verificar este documento';
  END IF;

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