-- Bucket privado para PDFs do selo físico
INSERT INTO storage.buckets (id, name, public)
VALUES ('seal-pdfs', 'seal-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: leitura por membros da mesma organização (path: {org_id}/...)
CREATE POLICY "Seal PDFs - org members can read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'seal-pdfs'
  AND (storage.foldername(name))[1] = public.get_user_org_id(auth.uid())::text
);

CREATE POLICY "Seal PDFs - org members can insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'seal-pdfs'
  AND (storage.foldername(name))[1] = public.get_user_org_id(auth.uid())::text
);

CREATE POLICY "Seal PDFs - org members can delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'seal-pdfs'
  AND (storage.foldername(name))[1] = public.get_user_org_id(auth.uid())::text
);