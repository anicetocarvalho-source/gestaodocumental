-- Add DELETE policy for process_documents
-- Allow users to delete process documents if they uploaded them or have access to the process

CREATE POLICY "Users can delete process documents"
ON public.process_documents
FOR DELETE
USING (
  -- User uploaded the document
  uploaded_by IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR
  -- User has access to the process (created it or is responsible)
  process_id IN (
    SELECT id FROM public.processes
    WHERE created_by = auth.uid()
      OR responsible_user_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
  )
);