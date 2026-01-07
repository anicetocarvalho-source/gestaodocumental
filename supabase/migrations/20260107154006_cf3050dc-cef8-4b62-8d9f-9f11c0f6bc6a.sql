
-- =====================================================
-- SECURITY IMPROVEMENTS FOR RLS POLICIES
-- =====================================================

-- 1. FIX process_stages - Remove dangerous ALL policy and add proper INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Users can manage process stages" ON public.process_stages;

CREATE POLICY "Users can insert process stages"
ON public.process_stages
FOR INSERT
WITH CHECK (
  process_id IN (
    SELECT id FROM public.processes
    WHERE created_by = auth.uid()
      OR responsible_user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR current_unit_id IN (SELECT unit_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can update process stages"
ON public.process_stages
FOR UPDATE
USING (
  process_id IN (
    SELECT id FROM public.processes
    WHERE created_by = auth.uid()
      OR responsible_user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR current_unit_id IN (SELECT unit_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can delete process stages"
ON public.process_stages
FOR DELETE
USING (
  process_id IN (
    SELECT id FROM public.processes
    WHERE created_by = auth.uid()
      OR responsible_user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- 2. FIX document_movements INSERT - Only allow if user has access to the document
DROP POLICY IF EXISTS "Users can create movements" ON public.document_movements;

CREATE POLICY "Users can create movements for accessible documents"
ON public.document_movements
FOR INSERT
WITH CHECK (
  document_id IN (
    SELECT id FROM public.documents
    WHERE created_by = auth.uid()
      OR responsible_user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR current_unit_id IN (SELECT unit_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- 3. FIX process_movements INSERT - Only allow if user has access to the process
DROP POLICY IF EXISTS "Users can create process movements" ON public.process_movements;

CREATE POLICY "Users can create process movements for accessible processes"
ON public.process_movements
FOR INSERT
WITH CHECK (
  process_id IN (
    SELECT id FROM public.processes
    WHERE created_by = auth.uid()
      OR responsible_user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR current_unit_id IN (SELECT unit_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- 4. FIX document_files INSERT - Only allow if user has access to the document
DROP POLICY IF EXISTS "Users can upload files to accessible documents" ON public.document_files;

CREATE POLICY "Users can upload files to accessible documents"
ON public.document_files
FOR INSERT
WITH CHECK (
  document_id IN (
    SELECT id FROM public.documents
    WHERE created_by = auth.uid()
      OR responsible_user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR current_unit_id IN (SELECT unit_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- 5. FIX process_documents INSERT - Only allow if user has access to the process
DROP POLICY IF EXISTS "Users can add process documents" ON public.process_documents;

CREATE POLICY "Users can add documents to accessible processes"
ON public.process_documents
FOR INSERT
WITH CHECK (
  process_id IN (
    SELECT id FROM public.processes
    WHERE created_by = auth.uid()
      OR responsible_user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR current_unit_id IN (SELECT unit_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- 6. FIX document_comments INSERT - Only allow if user has access to the document
DROP POLICY IF EXISTS "Users can create comments" ON public.document_comments;

CREATE POLICY "Users can create comments on accessible documents"
ON public.document_comments
FOR INSERT
WITH CHECK (
  document_id IN (
    SELECT id FROM public.documents
    WHERE created_by = auth.uid()
      OR responsible_user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR current_unit_id IN (SELECT unit_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- 7. FIX process_comments INSERT - Only allow if user has access to the process
DROP POLICY IF EXISTS "Users can create process comments" ON public.process_comments;

CREATE POLICY "Users can create comments on accessible processes"
ON public.process_comments
FOR INSERT
WITH CHECK (
  process_id IN (
    SELECT id FROM public.processes
    WHERE created_by = auth.uid()
      OR responsible_user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR current_unit_id IN (SELECT unit_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- 8. FIX process_opinions INSERT - Only allow if user has access to the process
DROP POLICY IF EXISTS "Users can create process opinions" ON public.process_opinions;

CREATE POLICY "Users can create opinions on accessible processes"
ON public.process_opinions
FOR INSERT
WITH CHECK (
  process_id IN (
    SELECT id FROM public.processes
    WHERE created_by = auth.uid()
      OR responsible_user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR current_unit_id IN (SELECT unit_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- 9. Restrict process_opinions SELECT to users with access to the process
DROP POLICY IF EXISTS "Users can view process opinions" ON public.process_opinions;

CREATE POLICY "Users can view opinions of accessible processes"
ON public.process_opinions
FOR SELECT
USING (
  process_id IN (
    SELECT id FROM public.processes
    WHERE created_by = auth.uid()
      OR responsible_user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR current_unit_id IN (SELECT unit_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- 10. Restrict document_comments SELECT to users with access to the document
DROP POLICY IF EXISTS "Users can view comments" ON public.document_comments;

CREATE POLICY "Users can view comments on accessible documents"
ON public.document_comments
FOR SELECT
USING (
  document_id IN (
    SELECT id FROM public.documents
    WHERE created_by = auth.uid()
      OR responsible_user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR current_unit_id IN (SELECT unit_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- 11. Restrict process_comments SELECT to users with access to the process
DROP POLICY IF EXISTS "Users can view process comments" ON public.process_comments;

CREATE POLICY "Users can view comments on accessible processes"
ON public.process_comments
FOR SELECT
USING (
  process_id IN (
    SELECT id FROM public.processes
    WHERE created_by = auth.uid()
      OR responsible_user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR current_unit_id IN (SELECT unit_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- 12. Restrict process_documents SELECT to users with access to the process
DROP POLICY IF EXISTS "Users can view process documents" ON public.process_documents;

CREATE POLICY "Users can view documents of accessible processes"
ON public.process_documents
FOR SELECT
USING (
  process_id IN (
    SELECT id FROM public.processes
    WHERE created_by = auth.uid()
      OR responsible_user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR current_unit_id IN (SELECT unit_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- 13. Restrict document_signatures SELECT to users with access to the document
DROP POLICY IF EXISTS "Users can view signatures" ON public.document_signatures;

CREATE POLICY "Users can view signatures on accessible documents"
ON public.document_signatures
FOR SELECT
USING (
  document_id IN (
    SELECT id FROM public.documents
    WHERE created_by = auth.uid()
      OR responsible_user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR current_unit_id IN (SELECT unit_id FROM public.profiles WHERE user_id = auth.uid())
  )
);
