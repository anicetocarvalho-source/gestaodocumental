-- Create table for digitization batches
CREATE TABLE public.digitization_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error', 'paused')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  total_pages INTEGER NOT NULL DEFAULT 0,
  processed_pages INTEGER NOT NULL DEFAULT 0,
  error_pages INTEGER NOT NULL DEFAULT 0,
  operator_id UUID REFERENCES public.profiles(id),
  classification_id UUID REFERENCES public.classification_codes(id),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create table for scanned documents within batches
CREATE TABLE public.scanned_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.digitization_batches(id) ON DELETE CASCADE,
  document_number TEXT NOT NULL,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scanning', 'ocr_processing', 'quality_review', 'completed', 'error', 'rejected')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  page_count INTEGER NOT NULL DEFAULT 1,
  file_path TEXT,
  file_size INTEGER,
  mime_type TEXT,
  ocr_text TEXT,
  ocr_confidence DECIMAL(5,2),
  detected_language TEXT,
  quality_score DECIMAL(5,2),
  quality_flags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  operator_id UUID REFERENCES public.profiles(id),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.digitization_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanned_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for digitization_batches
CREATE POLICY "Authenticated users can view batches"
  ON public.digitization_batches FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create batches"
  ON public.digitization_batches FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update batches they created or are assigned to"
  ON public.digitization_batches FOR UPDATE
  USING (
    created_by = auth.uid() OR 
    operator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- RLS policies for scanned_documents
CREATE POLICY "Authenticated users can view scanned documents"
  ON public.scanned_documents FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create scanned documents"
  ON public.scanned_documents FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update scanned documents"
  ON public.scanned_documents FOR UPDATE
  USING (
    operator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    batch_id IN (SELECT id FROM digitization_batches WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can delete scanned documents from their batches"
  ON public.scanned_documents FOR DELETE
  USING (
    batch_id IN (SELECT id FROM digitization_batches WHERE created_by = auth.uid())
  );

-- Create indexes for better performance
CREATE INDEX idx_digitization_batches_status ON public.digitization_batches(status);
CREATE INDEX idx_digitization_batches_created_by ON public.digitization_batches(created_by);
CREATE INDEX idx_scanned_documents_batch_id ON public.scanned_documents(batch_id);
CREATE INDEX idx_scanned_documents_status ON public.scanned_documents(status);

-- Trigger for updating updated_at
CREATE TRIGGER update_digitization_batches_updated_at
  BEFORE UPDATE ON public.digitization_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scanned_documents_updated_at
  BEFORE UPDATE ON public.scanned_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate batch number
CREATE OR REPLACE FUNCTION public.generate_batch_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.batch_number IS NULL OR NEW.batch_number = '' THEN
    NEW.batch_number := 'LOTE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
      LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(batch_number FROM 'LOTE-[0-9]{8}-([0-9]+)') AS INTEGER)), 0) + 1 
            FROM public.digitization_batches 
            WHERE batch_number LIKE 'LOTE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_batch_number_trigger
  BEFORE INSERT ON public.digitization_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_batch_number();