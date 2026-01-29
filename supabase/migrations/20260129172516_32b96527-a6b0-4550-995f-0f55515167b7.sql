-- Enable realtime with RLS for notifications table
-- This ensures that realtime subscriptions respect RLS policies
ALTER TABLE public.notifications REPLICA IDENTITY FULL;