
-- Create protocol entries table
CREATE TABLE public.protocol_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_number TEXT NOT NULL UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('entrada', 'saida')),
  subject TEXT NOT NULL,
  sender_name TEXT,
  sender_institution TEXT,
  recipient_name TEXT,
  recipient_institution TEXT,
  document_date DATE,
  received_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivery_method TEXT DEFAULT 'correio',
  observations TEXT,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.organizational_units(id),
  registered_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sequential numbering function
CREATE OR REPLACE FUNCTION public.generate_protocol_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  year_part TEXT;
  prefix TEXT;
  sequence_number INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  prefix := CASE NEW.direction
    WHEN 'entrada' THEN 'ENT'
    WHEN 'saida' THEN 'SAI'
  END;

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(protocol_number FROM prefix || '-' || year_part || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO sequence_number
  FROM public.protocol_entries
  WHERE protocol_number LIKE prefix || '-' || year_part || '-%';

  NEW.protocol_number := prefix || '-' || year_part || '-' || LPAD(sequence_number::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_protocol_number
  BEFORE INSERT ON public.protocol_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_protocol_number();

-- Updated at trigger
CREATE TRIGGER update_protocol_entries_updated_at
  BEFORE UPDATE ON public.protocol_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.protocol_entries ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view protocol entries"
  ON public.protocol_entries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create protocol entries"
  ON public.protocol_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creator, admin and gestor can update"
  ON public.protocol_entries FOR UPDATE
  TO authenticated
  USING (
    registered_by = auth.uid()
    OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role])
  );

CREATE POLICY "Only admin can delete protocol entries"
  ON public.protocol_entries FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes
CREATE INDEX idx_protocol_entries_direction ON public.protocol_entries(direction);
CREATE INDEX idx_protocol_entries_created_at ON public.protocol_entries(created_at);
CREATE INDEX idx_protocol_entries_unit_id ON public.protocol_entries(unit_id);
CREATE INDEX idx_protocol_entries_protocol_number ON public.protocol_entries(protocol_number);
