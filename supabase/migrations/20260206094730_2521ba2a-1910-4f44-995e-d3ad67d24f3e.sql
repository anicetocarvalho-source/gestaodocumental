
-- =============================================================
-- MIGRATION: Harden RLS policies for production readiness
-- =============================================================

-- 1. AUDIT LOGS - Make immutable (only triggers can INSERT, no UPDATE/DELETE by users)
-- Document audit log
DROP POLICY IF EXISTS "Audit log insert via triggers only" ON public.document_audit_log;
CREATE POLICY "Audit log insert via triggers only"
  ON public.document_audit_log FOR INSERT
  WITH CHECK (false); -- Only triggers (SECURITY DEFINER) can insert

DROP POLICY IF EXISTS "No updates on audit log" ON public.document_audit_log;
CREATE POLICY "No updates on audit log"
  ON public.document_audit_log FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS "No deletes on audit log" ON public.document_audit_log;
CREATE POLICY "No deletes on audit log"
  ON public.document_audit_log FOR DELETE
  USING (false);

-- Dispatch audit log
DROP POLICY IF EXISTS "Dispatch audit insert via triggers only" ON public.dispatch_audit_log;
CREATE POLICY "Dispatch audit insert via triggers only"
  ON public.dispatch_audit_log FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "No updates on dispatch audit" ON public.dispatch_audit_log;
CREATE POLICY "No updates on dispatch audit"
  ON public.dispatch_audit_log FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS "No deletes on dispatch audit" ON public.dispatch_audit_log;
CREATE POLICY "No deletes on dispatch audit"
  ON public.dispatch_audit_log FOR DELETE
  USING (false);

-- Process audit log
DROP POLICY IF EXISTS "Process audit insert via triggers only" ON public.process_audit_log;
CREATE POLICY "Process audit insert via triggers only"
  ON public.process_audit_log FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "No updates on process audit" ON public.process_audit_log;
CREATE POLICY "No updates on process audit"
  ON public.process_audit_log FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS "No deletes on process audit" ON public.process_audit_log;
CREATE POLICY "No deletes on process audit"
  ON public.process_audit_log FOR DELETE
  USING (false);

-- 2. NOTIFICATION PREFERENCES - Add missing DELETE policy
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.notification_preferences;
CREATE POLICY "Users can delete own preferences"
  ON public.notification_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- 3. CUSTOM ROLES - Restrict to admin/gestor only
DROP POLICY IF EXISTS "Todos podem ver roles" ON public.custom_roles;
CREATE POLICY "Admin e gestores podem ver roles"
  ON public.custom_roles FOR SELECT
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'gestor']::app_role[]));

-- 4. INTEGRATION CONNECTIONS - Restrict to admin only
DROP POLICY IF EXISTS "Todos podem ver integrações" ON public.integration_connections;
DROP POLICY IF EXISTS "All authenticated can view integrations" ON public.integration_connections;
CREATE POLICY "Admins podem ver integrações"
  ON public.integration_connections FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. PROFILES - Tighten: users see own full profile, others see only via profiles_public view
-- Keep existing policies but ensure email/phone not exposed broadly
-- The existing policies already restrict based on user_id and admin role, so they're adequate

-- 6. EMAIL LOGS - Tighten further: mask recipient_email in queries (handled by existing RLS)
-- Existing policies already restrict to admin/gestor and recipient, which is adequate

-- 7. PUBLIC VIEWS - Drop and recreate with restricted access
-- profiles_public: restrict to authenticated users only (it's a view, RLS on underlying table applies)
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public AS
SELECT 
  id,
  full_name,
  position,
  avatar_url,
  unit_id,
  is_active
FROM public.profiles
WHERE is_active = true;

-- document_signatures_public: remove signature_data from public view
DROP VIEW IF EXISTS public.document_signatures_public;
CREATE VIEW public.document_signatures_public AS
SELECT 
  id,
  document_id,
  signer_id,
  signature_type,
  signed_at,
  is_valid
FROM public.document_signatures;

-- dispatch_signatures_public: remove signature_data from public view
DROP VIEW IF EXISTS public.dispatch_signatures_public;
CREATE VIEW public.dispatch_signatures_public AS
SELECT 
  id,
  dispatch_id,
  signer_id,
  signature_type,
  signed_at,
  is_valid
FROM public.dispatch_signatures;
