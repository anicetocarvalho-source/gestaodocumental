
-- Fix remaining permissive INSERT policies

-- 1. Documents INSERT - Restrict to authenticated users only
DROP POLICY IF EXISTS "Users can create documents" ON public.documents;

CREATE POLICY "Authenticated users can create documents"
ON public.documents
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- 2. Processes INSERT - Restrict to authenticated users only
DROP POLICY IF EXISTS "Users can create processes" ON public.processes;

CREATE POLICY "Authenticated users can create processes"
ON public.processes
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Note: notifications INSERT policy needs to remain with true
-- because it's used by database triggers (SECURITY DEFINER functions)
-- that create notifications on behalf of the system
