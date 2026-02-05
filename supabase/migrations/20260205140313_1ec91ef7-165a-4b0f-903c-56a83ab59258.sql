-- SEC-01: Restringir acesso à tabela profiles
-- Criar view pública que oculta dados sensíveis (email, phone)

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  full_name,
  position,
  unit_id,
  avatar_url,
  is_active,
  created_at,
  updated_at
FROM public.profiles;

-- Comentário explicativo
COMMENT ON VIEW public.profiles_public IS 'View pública de profiles sem dados sensíveis (email, phone)';

-- SEC-02: Criar view para document_signatures que oculta IP e device_info

CREATE OR REPLACE VIEW public.document_signatures_public
WITH (security_invoker = on) AS
SELECT 
  id,
  document_id,
  signer_id,
  signature_type,
  signature_data,
  signed_at,
  is_valid
  -- Exclui: ip_address, device_info
FROM public.document_signatures;

COMMENT ON VIEW public.document_signatures_public IS 'View de assinaturas sem dados de IP e dispositivo';

-- Criar view para dispatch_signatures também

CREATE OR REPLACE VIEW public.dispatch_signatures_public
WITH (security_invoker = on) AS
SELECT 
  id,
  dispatch_id,
  signer_id,
  signature_type,
  signature_data,
  signed_at,
  is_valid
  -- Exclui: ip_address, device_info, certificate_info
FROM public.dispatch_signatures;

COMMENT ON VIEW public.dispatch_signatures_public IS 'View de assinaturas de despachos sem dados sensíveis';

-- Restringir acesso directo às tabelas base para utilizadores não-admin
-- Manter acesso para funções SECURITY DEFINER e triggers

-- Política para profiles: utilizadores só vêem o seu próprio perfil completo
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Para document_signatures: restringir acesso aos dados sensíveis
DROP POLICY IF EXISTS "Anyone can view signatures" ON public.document_signatures;
DROP POLICY IF EXISTS "Authenticated users can view signatures" ON public.document_signatures;

-- Apenas o signatário e admins podem ver os detalhes completos
CREATE POLICY "Signers can view own signatures" 
ON public.document_signatures 
FOR SELECT 
USING (
  signer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Para dispatch_signatures: mesma lógica
DROP POLICY IF EXISTS "Anyone can view dispatch signatures" ON public.dispatch_signatures;
DROP POLICY IF EXISTS "Authenticated users can view dispatch signatures" ON public.dispatch_signatures;

CREATE POLICY "Signers can view own dispatch signatures" 
ON public.dispatch_signatures 
FOR SELECT 
USING (
  signer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);