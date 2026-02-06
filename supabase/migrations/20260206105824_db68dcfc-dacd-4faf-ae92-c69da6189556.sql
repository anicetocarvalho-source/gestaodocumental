
-- Fix Security Definer Views - add security_invoker=on

DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT 
  id,
  full_name,
  position,
  avatar_url,
  unit_id,
  is_active
FROM public.profiles
WHERE is_active = true;

DROP VIEW IF EXISTS public.document_signatures_public;
CREATE VIEW public.document_signatures_public
WITH (security_invoker=on) AS
SELECT 
  id,
  document_id,
  signer_id,
  signature_type,
  signed_at,
  is_valid
FROM public.document_signatures;

DROP VIEW IF EXISTS public.dispatch_signatures_public;
CREATE VIEW public.dispatch_signatures_public
WITH (security_invoker=on) AS
SELECT 
  id,
  dispatch_id,
  signer_id,
  signature_type,
  signed_at,
  is_valid
FROM public.dispatch_signatures;
