
-- =====================================================
-- AUDIT LOG (append-only)
-- =====================================================
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  old_data jsonb,
  new_data jsonb,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_table_record ON public.audit_log(table_name, record_id, created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_admin_select" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[]));

-- No INSERT/UPDATE/DELETE policies for users; only SECURITY DEFINER triggers can write.
REVOKE INSERT, UPDATE, DELETE ON public.audit_log FROM authenticated, anon;

-- =====================================================
-- PHYSICAL SEALS
-- =====================================================
CREATE TABLE public.physical_seals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  protocol_number text NOT NULL,
  protocol_type text NOT NULL CHECK (protocol_type IN ('ENT','SAI','INT')),
  document_title text NOT NULL,
  sender_name text,
  recipient_name text,
  subject text NOT NULL,
  pdf_hash text,
  pdf_storage_path text,
  validation_token text NOT NULL UNIQUE,
  qr_payload text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled')),
  cancellation_reason text,
  cancelled_by uuid REFERENCES auth.users(id),
  cancelled_at timestamptz
);

CREATE UNIQUE INDEX idx_seals_org_protocol ON public.physical_seals(organization_id, protocol_number);
CREATE INDEX idx_seals_org_created ON public.physical_seals(organization_id, created_at DESC);
CREATE INDEX idx_seals_pdf_hash ON public.physical_seals(pdf_hash) WHERE pdf_hash IS NOT NULL;

ALTER TABLE public.physical_seals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seals_select_same_org" ON public.physical_seals
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "seals_insert_same_org" ON public.physical_seals
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_user_org_id(auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "seals_update_admin_gestor" ON public.physical_seals
  FOR UPDATE TO authenticated
  USING (
    organization_id = public.get_user_org_id(auth.uid())
    AND public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[])
  )
  WITH CHECK (organization_id = public.get_user_org_id(auth.uid()));

-- =====================================================
-- SEAL MOVEMENTS
-- =====================================================
CREATE TABLE public.seal_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seal_id uuid NOT NULL REFERENCES public.physical_seals(id) ON DELETE CASCADE,
  from_user_id uuid REFERENCES auth.users(id),
  to_user_id uuid REFERENCES auth.users(id),
  from_department text,
  to_department text,
  movement_type text NOT NULL CHECK (movement_type IN ('initial','handoff','archive','return')),
  notes text,
  scanned_qr boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_movements_seal_created ON public.seal_movements(seal_id, created_at DESC);
CREATE INDEX idx_movements_to_user ON public.seal_movements(to_user_id, created_at DESC);

ALTER TABLE public.seal_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "movements_select_same_org" ON public.seal_movements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.physical_seals s
      WHERE s.id = seal_movements.seal_id
        AND s.organization_id = public.get_user_org_id(auth.uid())
    )
  );

CREATE POLICY "movements_insert_same_org" ON public.seal_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.physical_seals s
      WHERE s.id = seal_movements.seal_id
        AND s.organization_id = public.get_user_org_id(auth.uid())
    )
  );

-- =====================================================
-- SEAL VALIDATION LOG
-- =====================================================
CREATE TABLE public.seal_validation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seal_id uuid REFERENCES public.physical_seals(id) ON DELETE SET NULL,
  validation_token text NOT NULL,
  ip_address inet,
  user_agent text,
  pdf_uploaded boolean NOT NULL DEFAULT false,
  pdf_hash_match boolean,
  validated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_validation_seal ON public.seal_validation_log(seal_id, validated_at DESC);
CREATE INDEX idx_validation_token ON public.seal_validation_log(validation_token, validated_at DESC);

ALTER TABLE public.seal_validation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "validation_insert_public" ON public.seal_validation_log
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "validation_select_same_org" ON public.seal_validation_log
  FOR SELECT TO authenticated
  USING (
    seal_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.physical_seals s
      WHERE s.id = seal_validation_log.seal_id
        AND s.organization_id = public.get_user_org_id(auth.uid())
    )
  );

-- =====================================================
-- PROTOCOL COUNTERS + FUNCTION
-- =====================================================
CREATE TABLE public.protocol_counters (
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  protocol_type text NOT NULL CHECK (protocol_type IN ('ENT','SAI','INT')),
  year int NOT NULL,
  counter int NOT NULL DEFAULT 0,
  PRIMARY KEY (organization_id, protocol_type, year)
);

ALTER TABLE public.protocol_counters ENABLE ROW LEVEL SECURITY;
-- No public policies — only the SECURITY DEFINER function below may touch it.

CREATE OR REPLACE FUNCTION public.get_next_protocol_number(
  org_id uuid,
  ptype text,
  yr int
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_val int;
BEGIN
  IF ptype NOT IN ('ENT','SAI','INT') THEN
    RAISE EXCEPTION 'Invalid protocol_type: %', ptype;
  END IF;

  INSERT INTO public.protocol_counters (organization_id, protocol_type, year, counter)
  VALUES (org_id, ptype, yr, 1)
  ON CONFLICT (organization_id, protocol_type, year)
  DO UPDATE SET counter = protocol_counters.counter + 1
  RETURNING counter INTO next_val;

  RETURN format('%s-%s-%s', ptype, yr::text, lpad(next_val::text, 5, '0'));
END;
$$;

REVOKE ALL ON FUNCTION public.get_next_protocol_number(uuid, text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_next_protocol_number(uuid, text, int) TO authenticated;

-- =====================================================
-- AUDIT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    rec_id := OLD.id;
    INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, rec_id, TG_OP, to_jsonb(OLD), NULL, auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    rec_id := NEW.id;
    INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, rec_id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSE
    rec_id := NEW.id;
    INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, rec_id, TG_OP, NULL, to_jsonb(NEW), auth.uid());
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER audit_physical_seals
  AFTER INSERT OR UPDATE OR DELETE ON public.physical_seals
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_seal_movements
  AFTER INSERT OR UPDATE OR DELETE ON public.seal_movements
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
