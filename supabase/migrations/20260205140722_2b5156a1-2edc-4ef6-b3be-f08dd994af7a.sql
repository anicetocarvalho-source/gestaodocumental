-- SEC-03: Restringir acesso aos audit logs
-- Apenas admins e gestores podem ver logs de auditoria

-- document_audit_log
DROP POLICY IF EXISTS "Anyone can view audit logs" ON public.document_audit_log;
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON public.document_audit_log;

CREATE POLICY "Admins and managers can view document audit logs" 
ON public.document_audit_log 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'gestor')
);

-- dispatch_audit_log
DROP POLICY IF EXISTS "Anyone can view dispatch audit logs" ON public.dispatch_audit_log;
DROP POLICY IF EXISTS "Authenticated users can view dispatch audit logs" ON public.dispatch_audit_log;

CREATE POLICY "Admins and managers can view dispatch audit logs" 
ON public.dispatch_audit_log 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'gestor')
);

-- process_audit_log
DROP POLICY IF EXISTS "Anyone can view process audit logs" ON public.process_audit_log;
DROP POLICY IF EXISTS "Authenticated users can view process audit logs" ON public.process_audit_log;

CREATE POLICY "Admins and managers can view process audit logs" 
ON public.process_audit_log 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'gestor')
);

-- SEC-04: Corrigir funções sem search_path fixo

CREATE OR REPLACE FUNCTION public.generate_batch_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.batch_number IS NULL OR NEW.batch_number = '' THEN
    NEW.batch_number := 'LOTE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
      LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(batch_number FROM 'LOTE-[0-9]{8}-([0-9]+)') AS INTEGER)), 0) + 1 
            FROM public.digitization_batches 
            WHERE batch_number LIKE 'LOTE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$;