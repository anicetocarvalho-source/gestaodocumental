-- Create a SECURITY DEFINER function to check if user can access a dispatch
-- This avoids infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.user_can_access_dispatch(_dispatch_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM dispatches d
    WHERE d.id = _dispatch_id
    AND (
      -- User is the creator
      d.created_by = _user_id
      -- User is the signer
      OR d.signer_id IN (SELECT id FROM profiles WHERE user_id = _user_id)
      -- User is in the origin unit
      OR d.origin_unit_id IN (SELECT unit_id FROM profiles WHERE user_id = _user_id)
      -- User is a direct recipient
      OR EXISTS (
        SELECT 1 FROM dispatch_recipients dr
        WHERE dr.dispatch_id = d.id
        AND (
          dr.profile_id IN (SELECT id FROM profiles WHERE user_id = _user_id)
          OR dr.unit_id IN (SELECT unit_id FROM profiles WHERE user_id = _user_id)
        )
      )
    )
  )
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view recipients of accessible dispatches" ON public.dispatch_recipients;
DROP POLICY IF EXISTS "Users can view approvals of accessible dispatches" ON public.dispatch_approvals;

-- Create simplified RLS policy for dispatch_recipients SELECT using the function
CREATE POLICY "Users can view recipients of accessible dispatches"
ON public.dispatch_recipients
FOR SELECT
TO authenticated
USING (public.user_can_access_dispatch(dispatch_id, auth.uid()));

-- Create simplified RLS policy for dispatch_approvals SELECT using the function
CREATE POLICY "Users can view approvals of accessible dispatches"
ON public.dispatch_approvals
FOR SELECT
TO authenticated
USING (public.user_can_access_dispatch(dispatch_id, auth.uid()));

-- Also allow approvers to see their own approvals
CREATE POLICY "Approvers can view their own approvals"
ON public.dispatch_approvals
FOR SELECT
TO authenticated
USING (approver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));