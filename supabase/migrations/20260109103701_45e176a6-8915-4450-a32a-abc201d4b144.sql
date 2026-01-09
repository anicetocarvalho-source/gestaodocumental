-- Create classification history table
CREATE TABLE public.classification_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  old_classification_id UUID REFERENCES public.classification_codes(id),
  new_classification_id UUID NOT NULL REFERENCES public.classification_codes(id),
  changed_by UUID NOT NULL REFERENCES public.profiles(id),
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_classification_history_document ON public.classification_history(document_id);
CREATE INDEX idx_classification_history_created ON public.classification_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.classification_history ENABLE ROW LEVEL SECURITY;

-- Policies for classification history
CREATE POLICY "Authenticated users can view classification history"
ON public.classification_history
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert classification history"
ON public.classification_history
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.classification_history IS 'Histórico de alterações de classificação de documentos';