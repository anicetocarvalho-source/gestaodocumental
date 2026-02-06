-- Fix overly permissive audit log policies
-- document_audit_log: remove the "USING(true)" policy, keep admin/gestor only
DROP POLICY IF EXISTS "Users can view audit logs" ON public.document_audit_log;

-- process_audit_log: remove the "USING(true)" policy, keep admin/gestor only
DROP POLICY IF EXISTS "Users can view process audit log" ON public.process_audit_log;

-- Add policy so document creators can see their own document audit logs
CREATE POLICY "Users can view own document audit logs"
ON public.document_audit_log
FOR SELECT
USING (
  document_id IN (
    SELECT id FROM public.documents
    WHERE created_by = auth.uid()
    OR responsible_user_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

-- Add policy so process creators can see their own process audit logs
CREATE POLICY "Users can view own process audit logs"
ON public.process_audit_log
FOR SELECT
USING (
  process_id IN (
    SELECT id FROM public.processes
    WHERE created_by = auth.uid()
    OR responsible_user_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);