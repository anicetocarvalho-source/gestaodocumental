-- Fix permissive RLS policy on notifications table
-- Only allow users to insert notifications for themselves

DROP POLICY IF EXISTS "Allow insert notifications" ON public.notifications;

CREATE POLICY "Users can receive notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Also ensure users can only read their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Update policy to allow system/triggers to insert (via security definer functions)
-- The existing trigger functions already use SECURITY DEFINER