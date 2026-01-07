-- Create approval status enum
CREATE TYPE public.approval_status AS ENUM ('pendente', 'aprovado', 'rejeitado', 'devolvido');

-- Create dispatch approvals table for workflow
CREATE TABLE public.dispatch_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispatch_id UUID NOT NULL REFERENCES public.dispatches(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES public.profiles(id),
  approval_order INTEGER NOT NULL DEFAULT 1,
  status approval_status NOT NULL DEFAULT 'pendente',
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dispatch signatures table
CREATE TABLE public.dispatch_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispatch_id UUID NOT NULL REFERENCES public.dispatches(id) ON DELETE CASCADE,
  signer_id UUID NOT NULL REFERENCES public.profiles(id),
  signature_type TEXT NOT NULL CHECK (signature_type IN ('digital', 'manuscrita', 'certificado')),
  signature_data TEXT, -- Base64 encoded signature image for manuscrita
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_valid BOOLEAN NOT NULL DEFAULT true,
  ip_address TEXT,
  device_info TEXT,
  certificate_info JSONB -- For certificate-based signatures
);

-- Add workflow fields to dispatches table
ALTER TABLE public.dispatches 
ADD COLUMN requires_approval BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN approval_chain UUID[] DEFAULT '{}',
ADD COLUMN current_approval_step INTEGER DEFAULT 0,
ADD COLUMN workflow_status TEXT DEFAULT 'nao_iniciado' CHECK (workflow_status IN ('nao_iniciado', 'em_aprovacao', 'aprovado', 'rejeitado', 'assinado'));

-- Enable RLS
ALTER TABLE public.dispatch_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dispatch_approvals
CREATE POLICY "Users can view approvals of accessible dispatches"
ON public.dispatch_approvals FOR SELECT
USING (
  dispatch_id IN (
    SELECT id FROM dispatches WHERE
    created_by = auth.uid() OR
    signer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    origin_unit_id IN (SELECT unit_id FROM profiles WHERE user_id = auth.uid()) OR
    id IN (
      SELECT dispatch_id FROM dispatch_recipients
      WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR unit_id IN (SELECT unit_id FROM profiles WHERE user_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can create approvals for their dispatches"
ON public.dispatch_approvals FOR INSERT
WITH CHECK (
  dispatch_id IN (SELECT id FROM dispatches WHERE created_by = auth.uid())
);

CREATE POLICY "Approvers can update their own approval status"
ON public.dispatch_approvals FOR UPDATE
USING (
  approver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
  dispatch_id IN (SELECT id FROM dispatches WHERE created_by = auth.uid())
);

CREATE POLICY "Creators can delete approvals from their dispatches"
ON public.dispatch_approvals FOR DELETE
USING (dispatch_id IN (SELECT id FROM dispatches WHERE created_by = auth.uid()));

-- RLS Policies for dispatch_signatures
CREATE POLICY "Users can view signatures of accessible dispatches"
ON public.dispatch_signatures FOR SELECT
USING (
  dispatch_id IN (
    SELECT id FROM dispatches WHERE
    created_by = auth.uid() OR
    signer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    origin_unit_id IN (SELECT unit_id FROM profiles WHERE user_id = auth.uid()) OR
    id IN (
      SELECT dispatch_id FROM dispatch_recipients
      WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR unit_id IN (SELECT unit_id FROM profiles WHERE user_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can sign dispatches they are authorized to sign"
ON public.dispatch_signatures FOR INSERT
WITH CHECK (
  signer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) AND
  dispatch_id IN (
    SELECT id FROM dispatches WHERE
    created_by = auth.uid() OR
    signer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    id IN (
      SELECT dispatch_id FROM dispatch_approvals
      WHERE approver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      AND status = 'aprovado'
    )
  )
);

-- Create trigger for updated_at on approvals
CREATE TRIGGER update_dispatch_approvals_updated_at
BEFORE UPDATE ON public.dispatch_approvals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update dispatch workflow status when approval changes
CREATE OR REPLACE FUNCTION public.update_dispatch_workflow_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_approvals INTEGER;
  approved_count INTEGER;
  rejected_count INTEGER;
  dispatch_rec RECORD;
BEGIN
  -- Get dispatch info
  SELECT * INTO dispatch_rec FROM dispatches WHERE id = NEW.dispatch_id;
  
  -- Count approval statuses
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'aprovado'),
    COUNT(*) FILTER (WHERE status = 'rejeitado')
  INTO total_approvals, approved_count, rejected_count
  FROM dispatch_approvals
  WHERE dispatch_id = NEW.dispatch_id;
  
  -- Update dispatch workflow status
  IF rejected_count > 0 THEN
    UPDATE dispatches 
    SET workflow_status = 'rejeitado', 
        current_approval_step = (SELECT approval_order FROM dispatch_approvals WHERE id = NEW.id)
    WHERE id = NEW.dispatch_id;
  ELSIF approved_count = total_approvals AND total_approvals > 0 THEN
    UPDATE dispatches 
    SET workflow_status = 'aprovado',
        current_approval_step = total_approvals
    WHERE id = NEW.dispatch_id;
  ELSE
    UPDATE dispatches 
    SET workflow_status = 'em_aprovacao',
        current_approval_step = approved_count
    WHERE id = NEW.dispatch_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for workflow status update
CREATE TRIGGER update_workflow_on_approval_change
AFTER UPDATE ON public.dispatch_approvals
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.update_dispatch_workflow_status();

-- Function to update dispatch status when signed
CREATE OR REPLACE FUNCTION public.update_dispatch_on_signature()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update dispatch workflow status to signed
  UPDATE dispatches 
  SET workflow_status = 'assinado'
  WHERE id = NEW.dispatch_id;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for signature
CREATE TRIGGER update_dispatch_on_signature_trigger
AFTER INSERT ON public.dispatch_signatures
FOR EACH ROW
EXECUTE FUNCTION public.update_dispatch_on_signature();