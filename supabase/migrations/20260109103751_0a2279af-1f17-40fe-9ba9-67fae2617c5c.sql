-- Drop overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can insert classification history" ON public.classification_history;

-- Create proper policy - users can only insert history for their own actions
CREATE POLICY "Users can insert their own classification history"
ON public.classification_history
FOR INSERT
TO authenticated
WITH CHECK (
  changed_by IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);