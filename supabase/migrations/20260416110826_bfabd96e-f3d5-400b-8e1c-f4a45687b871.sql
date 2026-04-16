
-- 1. Create default organization
INSERT INTO public.organizations (id, code, name, plan, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'MINAGRIF', 'MINAGRIF - Ministério da Agricultura e Florestas', 'enterprise', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Backfill organization_id on all main tables
UPDATE public.profiles SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.documents SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.dispatches SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.digitization_batches SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.organizational_units SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.classification_codes SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.document_types SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- 3. Fix organizational_units RLS - add SELECT policy for org-scoped access
DROP POLICY IF EXISTS "Authenticated users can view units" ON public.organizational_units;
DROP POLICY IF EXISTS "Users can view units in their org" ON public.organizational_units;

CREATE POLICY "Users can view units in their org"
ON public.organizational_units
FOR SELECT
TO authenticated
USING (
  (organization_id = get_user_org_id(auth.uid()))
  OR (organization_id IS NULL)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 4. Fix document_files RLS - add admin access for viewing
DROP POLICY IF EXISTS "Users can view files of accessible documents" ON public.document_files;

CREATE POLICY "Users can view files of accessible documents"
ON public.document_files
FOR SELECT
TO authenticated
USING (
  document_id IN (
    SELECT id FROM documents
    WHERE (
      current_unit_id IN (SELECT unit_id FROM profiles WHERE user_id = auth.uid())
      OR responsible_user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR created_by = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

-- 5. Fix document_movements RLS - add admin access
DROP POLICY IF EXISTS "Users can view movements of accessible documents" ON public.document_movements;

CREATE POLICY "Users can view movements of accessible documents"
ON public.document_movements
FOR SELECT
TO authenticated
USING (
  document_id IN (
    SELECT id FROM documents
    WHERE (
      current_unit_id IN (SELECT unit_id FROM profiles WHERE user_id = auth.uid())
      OR responsible_user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR created_by = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

-- 6. Fix document_signatures RLS - add admin to accessible docs policy
DROP POLICY IF EXISTS "Users can view signatures on accessible documents" ON public.document_signatures;

CREATE POLICY "Users can view signatures on accessible documents"
ON public.document_signatures
FOR SELECT
TO authenticated
USING (
  document_id IN (
    SELECT id FROM documents
    WHERE (
      current_unit_id IN (SELECT unit_id FROM profiles WHERE user_id = auth.uid())
      OR responsible_user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR created_by = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

-- 7. Fix document_comments RLS - add admin access for viewing
DROP POLICY IF EXISTS "Users can view comments on accessible documents" ON public.document_comments;

CREATE POLICY "Users can view comments on accessible documents"
ON public.document_comments
FOR SELECT
TO authenticated
USING (
  document_id IN (
    SELECT id FROM documents
    WHERE (
      current_unit_id IN (SELECT unit_id FROM profiles WHERE user_id = auth.uid())
      OR responsible_user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR created_by = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
);
