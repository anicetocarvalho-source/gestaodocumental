-- Create storage bucket for scanned documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'scanned-documents', 
  'scanned-documents', 
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/tiff', 'image/webp', 'application/pdf']
);

-- RLS policies for scanned-documents bucket
CREATE POLICY "Authenticated users can view scanned documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'scanned-documents');

CREATE POLICY "Authenticated users can upload scanned documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'scanned-documents');

CREATE POLICY "Authenticated users can update scanned documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'scanned-documents');

CREATE POLICY "Authenticated users can delete scanned documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'scanned-documents');