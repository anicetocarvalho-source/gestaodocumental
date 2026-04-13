
-- ==============================================
-- 1. Add organization_id to main tables FIRST
-- ==============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.dispatches
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.organizational_units
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.protocol_entries
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.digitization_batches
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.classification_codes
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.document_types
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

-- ==============================================
-- 2. Indexes
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_org ON public.documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_org ON public.dispatches(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_units_org ON public.organizational_units(organization_id);
CREATE INDEX IF NOT EXISTS idx_protocol_entries_org ON public.protocol_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_digitization_batches_org ON public.digitization_batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_classification_codes_org ON public.classification_codes(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_types_org ON public.document_types(organization_id);

-- ==============================================
-- 3. Helper function (columns now exist)
-- ==============================================
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- ==============================================
-- 4. Trigger to auto-fill organization_id
-- ==============================================
CREATE OR REPLACE FUNCTION public.set_organization_id_from_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.organization_id := get_user_org_id(auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_org_id_documents ON public.documents;
CREATE TRIGGER set_org_id_documents
  BEFORE INSERT ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id_from_user();

DROP TRIGGER IF EXISTS set_org_id_dispatches ON public.dispatches;
CREATE TRIGGER set_org_id_dispatches
  BEFORE INSERT ON public.dispatches
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id_from_user();

DROP TRIGGER IF EXISTS set_org_id_org_units ON public.organizational_units;
CREATE TRIGGER set_org_id_org_units
  BEFORE INSERT ON public.organizational_units
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id_from_user();

DROP TRIGGER IF EXISTS set_org_id_protocol_entries ON public.protocol_entries;
CREATE TRIGGER set_org_id_protocol_entries
  BEFORE INSERT ON public.protocol_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id_from_user();

DROP TRIGGER IF EXISTS set_org_id_digitization_batches ON public.digitization_batches;
CREATE TRIGGER set_org_id_digitization_batches
  BEFORE INSERT ON public.digitization_batches
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id_from_user();

DROP TRIGGER IF EXISTS set_org_id_classification_codes ON public.classification_codes;
CREATE TRIGGER set_org_id_classification_codes
  BEFORE INSERT ON public.classification_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id_from_user();

DROP TRIGGER IF EXISTS set_org_id_document_types ON public.document_types;
CREATE TRIGGER set_org_id_document_types
  BEFORE INSERT ON public.document_types
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id_from_user();

-- ==============================================
-- 5. RLS - Documents
-- ==============================================
DROP POLICY IF EXISTS "Users can view documents in their unit or assigned to them" ON public.documents;
DROP POLICY IF EXISTS "Users can view documents in their org" ON public.documents;
CREATE POLICY "Users can view documents in their org"
  ON public.documents FOR SELECT TO authenticated
  USING (
    (organization_id = get_user_org_id(auth.uid()) OR organization_id IS NULL)
    AND (
      current_unit_id IN (SELECT unit_id FROM profiles WHERE user_id = auth.uid())
      OR responsible_user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR created_by = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create documents" ON public.documents;
CREATE POLICY "Authenticated users can create documents"
  ON public.documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update documents they are responsible for" ON public.documents;
CREATE POLICY "Users can update documents they are responsible for"
  ON public.documents FOR UPDATE TO authenticated
  USING (
    (organization_id = get_user_org_id(auth.uid()) OR organization_id IS NULL)
    AND (
      responsible_user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR created_by = auth.uid()
    )
  );

-- ==============================================
-- 6. RLS - Dispatches
-- ==============================================
DROP POLICY IF EXISTS "Users can view dispatches they created or are recipients" ON public.dispatches;
DROP POLICY IF EXISTS "Users can view dispatches in their org" ON public.dispatches;
CREATE POLICY "Users can view dispatches in their org"
  ON public.dispatches FOR SELECT TO authenticated
  USING (
    (organization_id = get_user_org_id(auth.uid()) OR organization_id IS NULL OR has_role(auth.uid(), 'admin'::app_role))
    AND (
      created_by = auth.uid()
      OR signer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR origin_unit_id IN (SELECT unit_id FROM profiles WHERE user_id = auth.uid())
      OR id IN (
        SELECT dispatch_id FROM dispatch_recipients
        WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
           OR unit_id IN (SELECT unit_id FROM profiles WHERE user_id = auth.uid())
      )
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- ==============================================
-- 7. RLS - Organizational Units
-- ==============================================
DROP POLICY IF EXISTS "Authenticated users can view organizational units" ON public.organizational_units;
DROP POLICY IF EXISTS "Users can view org units in their org" ON public.organizational_units;
CREATE POLICY "Users can view org units in their org"
  ON public.organizational_units FOR SELECT TO authenticated
  USING (
    organization_id = get_user_org_id(auth.uid())
    OR organization_id IS NULL
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- ==============================================
-- 8. RLS - Classification Codes
-- ==============================================
DROP POLICY IF EXISTS "Authenticated users can view classification codes" ON public.classification_codes;
DROP POLICY IF EXISTS "Users can view classification codes in their org" ON public.classification_codes;
CREATE POLICY "Users can view classification codes in their org"
  ON public.classification_codes FOR SELECT TO authenticated
  USING (
    organization_id = get_user_org_id(auth.uid())
    OR organization_id IS NULL
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- ==============================================
-- 9. RLS - Document Types
-- ==============================================
DROP POLICY IF EXISTS "Authenticated users can view document types" ON public.document_types;
DROP POLICY IF EXISTS "Users can view document types in their org" ON public.document_types;
CREATE POLICY "Users can view document types in their org"
  ON public.document_types FOR SELECT TO authenticated
  USING (
    organization_id = get_user_org_id(auth.uid())
    OR organization_id IS NULL
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- ==============================================
-- 10. RLS - Protocol Entries
-- ==============================================
DROP POLICY IF EXISTS "Users can view their own protocol entries" ON public.protocol_entries;
DROP POLICY IF EXISTS "Users can view protocol entries in their org" ON public.protocol_entries;
CREATE POLICY "Users can view protocol entries in their org"
  ON public.protocol_entries FOR SELECT TO authenticated
  USING (
    organization_id = get_user_org_id(auth.uid())
    OR organization_id IS NULL
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- ==============================================
-- 11. RLS - Digitization Batches
-- ==============================================
DROP POLICY IF EXISTS "Authenticated users can view batches" ON public.digitization_batches;
DROP POLICY IF EXISTS "Users can view batches in their org" ON public.digitization_batches;
CREATE POLICY "Users can view batches in their org"
  ON public.digitization_batches FOR SELECT TO authenticated
  USING (
    (organization_id = get_user_org_id(auth.uid()) OR organization_id IS NULL)
    AND auth.uid() IS NOT NULL
  );
