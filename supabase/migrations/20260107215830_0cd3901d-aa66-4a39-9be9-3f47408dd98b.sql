-- Create dispatch type enum
CREATE TYPE public.dispatch_type AS ENUM ('informativo', 'determinativo', 'autorizativo', 'homologativo', 'decisorio');

-- Create dispatch status enum
CREATE TYPE public.dispatch_status AS ENUM ('rascunho', 'emitido', 'em_tramite', 'concluido', 'cancelado');

-- Create dispatch priority enum
CREATE TYPE public.dispatch_priority AS ENUM ('baixa', 'normal', 'alta', 'urgente');

-- Create dispatches table
CREATE TABLE public.dispatches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispatch_number TEXT NOT NULL,
  dispatch_type dispatch_type NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  status dispatch_status NOT NULL DEFAULT 'rascunho',
  priority dispatch_priority NOT NULL DEFAULT 'normal',
  origin_unit_id UUID REFERENCES public.organizational_units(id),
  deadline TIMESTAMP WITH TIME ZONE,
  requires_response BOOLEAN NOT NULL DEFAULT false,
  signer_id UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  emitted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

-- Create dispatch recipients table (many-to-many)
CREATE TABLE public.dispatch_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispatch_id UUID NOT NULL REFERENCES public.dispatches(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('unit', 'person')),
  unit_id UUID REFERENCES public.organizational_units(id),
  profile_id UUID REFERENCES public.profiles(id),
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_recipient CHECK (
    (recipient_type = 'unit' AND unit_id IS NOT NULL AND profile_id IS NULL) OR
    (recipient_type = 'person' AND profile_id IS NOT NULL AND unit_id IS NULL)
  )
);

-- Create dispatch documents table (attachments)
CREATE TABLE public.dispatch_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispatch_id UUID NOT NULL REFERENCES public.dispatches(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id),
  file_name TEXT,
  file_path TEXT,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_document CHECK (
    document_id IS NOT NULL OR file_path IS NOT NULL
  )
);

-- Create dispatch audit log
CREATE TABLE public.dispatch_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispatch_id UUID NOT NULL REFERENCES public.dispatches(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT,
  old_values JSONB,
  new_values JSONB,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dispatches
CREATE POLICY "Users can view dispatches they created or are recipients"
ON public.dispatches FOR SELECT
USING (
  created_by = auth.uid() OR
  signer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
  origin_unit_id IN (SELECT unit_id FROM profiles WHERE user_id = auth.uid()) OR
  id IN (
    SELECT dispatch_id FROM dispatch_recipients
    WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR unit_id IN (SELECT unit_id FROM profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Authenticated users can create dispatches"
ON public.dispatches FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update dispatches they created"
ON public.dispatches FOR UPDATE
USING (created_by = auth.uid() OR signer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS Policies for dispatch_recipients
CREATE POLICY "Users can view recipients of accessible dispatches"
ON public.dispatch_recipients FOR SELECT
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

CREATE POLICY "Users can add recipients to their dispatches"
ON public.dispatch_recipients FOR INSERT
WITH CHECK (
  dispatch_id IN (SELECT id FROM dispatches WHERE created_by = auth.uid())
);

CREATE POLICY "Users can update recipients of their dispatches"
ON public.dispatch_recipients FOR UPDATE
USING (
  dispatch_id IN (SELECT id FROM dispatches WHERE created_by = auth.uid()) OR
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
  unit_id IN (SELECT unit_id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete recipients from their dispatches"
ON public.dispatch_recipients FOR DELETE
USING (dispatch_id IN (SELECT id FROM dispatches WHERE created_by = auth.uid()));

-- RLS Policies for dispatch_documents
CREATE POLICY "Users can view documents of accessible dispatches"
ON public.dispatch_documents FOR SELECT
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

CREATE POLICY "Users can add documents to their dispatches"
ON public.dispatch_documents FOR INSERT
WITH CHECK (dispatch_id IN (SELECT id FROM dispatches WHERE created_by = auth.uid()));

CREATE POLICY "Users can delete documents from their dispatches"
ON public.dispatch_documents FOR DELETE
USING (dispatch_id IN (SELECT id FROM dispatches WHERE created_by = auth.uid()));

-- RLS Policies for dispatch_audit_log
CREATE POLICY "Users can view audit logs of accessible dispatches"
ON public.dispatch_audit_log FOR SELECT
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

-- Create function to generate dispatch number
CREATE OR REPLACE FUNCTION public.generate_dispatch_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  year_part TEXT;
  sequence_number INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(dispatch_number FROM 'DESP-' || year_part || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO sequence_number
  FROM public.dispatches
  WHERE dispatch_number LIKE 'DESP-' || year_part || '-%';
  
  NEW.dispatch_number := 'DESP-' || year_part || '-' || LPAD(sequence_number::TEXT, 4, '0');
  
  RETURN NEW;
END;
$function$;

-- Create trigger for dispatch number generation
CREATE TRIGGER generate_dispatch_number_trigger
BEFORE INSERT ON public.dispatches
FOR EACH ROW
WHEN (NEW.dispatch_number IS NULL OR NEW.dispatch_number = '')
EXECUTE FUNCTION public.generate_dispatch_number();

-- Create trigger for updated_at
CREATE TRIGGER update_dispatches_updated_at
BEFORE UPDATE ON public.dispatches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_dispatch_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.dispatch_audit_log (dispatch_id, action, description, new_values, performed_by)
    VALUES (NEW.id, 'create', 'Despacho criado', to_jsonb(NEW), NEW.created_by);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.dispatch_audit_log (dispatch_id, action, description, old_values, new_values, performed_by)
      VALUES (NEW.id, 'status_change', 'Estado alterado de ' || OLD.status || ' para ' || NEW.status, 
              jsonb_build_object('status', OLD.status), 
              jsonb_build_object('status', NEW.status), 
              NEW.created_by);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

-- Create audit trigger
CREATE TRIGGER audit_dispatch_changes_trigger
AFTER INSERT OR UPDATE ON public.dispatches
FOR EACH ROW
EXECUTE FUNCTION public.audit_dispatch_changes();

-- Enable realtime for dispatches
ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatches;