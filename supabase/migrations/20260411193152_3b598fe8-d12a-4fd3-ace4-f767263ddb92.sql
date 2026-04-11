
-- Create document_checkouts table
CREATE TABLE public.document_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL UNIQUE REFERENCES public.documents(id) ON DELETE CASCADE,
  checked_out_by UUID NOT NULL,
  checked_out_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '2 hours'),
  notes TEXT
);

ALTER TABLE public.document_checkouts ENABLE ROW LEVEL SECURITY;

-- SELECT: all authenticated can see (to show who locked)
CREATE POLICY "Authenticated users can view checkouts"
ON public.document_checkouts FOR SELECT
TO authenticated
USING (true);

-- INSERT: authenticated users can check out
CREATE POLICY "Authenticated users can check out documents"
ON public.document_checkouts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = checked_out_by);

-- UPDATE: owner or admin (extend timeout)
CREATE POLICY "Owner or admin can update checkout"
ON public.document_checkouts FOR UPDATE
TO authenticated
USING (
  checked_out_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- DELETE: owner, admin, or expired
CREATE POLICY "Owner admin or expired can delete checkout"
ON public.document_checkouts FOR DELETE
TO authenticated
USING (
  checked_out_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR expires_at < now()
);

-- Function to check checkout status
CREATE OR REPLACE FUNCTION public.is_document_checked_out(doc_id UUID)
RETURNS TABLE(checked_out boolean, user_id uuid, full_name text, expires_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    true AS checked_out,
    dc.checked_out_by AS user_id,
    p.full_name,
    dc.expires_at
  FROM public.document_checkouts dc
  JOIN public.profiles p ON p.user_id = dc.checked_out_by
  WHERE dc.document_id = doc_id
    AND dc.expires_at > now()
  LIMIT 1;
$$;
