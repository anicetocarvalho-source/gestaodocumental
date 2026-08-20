ALTER TABLE public.scanned_documents
  ADD COLUMN IF NOT EXISTS barcode text,
  ADD COLUMN IF NOT EXISTS qr_code text,
  ADD COLUMN IF NOT EXISTS keywords text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS document_date date,
  ADD COLUMN IF NOT EXISTS reference_number text,
  ADD COLUMN IF NOT EXISTS sender text,
  ADD COLUMN IF NOT EXISTS classification_id uuid REFERENCES public.classification_codes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS index_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS indexed_at timestamptz,
  ADD COLUMN IF NOT EXISTS indexed_by uuid;

CREATE UNIQUE INDEX IF NOT EXISTS scanned_documents_barcode_key ON public.scanned_documents (barcode) WHERE barcode IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS scanned_documents_qr_code_key ON public.scanned_documents (qr_code) WHERE qr_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS scanned_documents_keywords_idx ON public.scanned_documents USING gin (keywords);
CREATE INDEX IF NOT EXISTS scanned_documents_index_fields_idx ON public.scanned_documents USING gin (index_fields);
CREATE INDEX IF NOT EXISTS scanned_documents_search_idx ON public.scanned_documents
  USING gin (to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(ocr_text,'') || ' ' || coalesce(reference_number,'') || ' ' || coalesce(sender,'')));