-- Add new email notification preference columns
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS email_pending_approvals BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_sla_alerts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_movements BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_dispatch_updates BOOLEAN DEFAULT true;

-- Create email_logs table to track sent emails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID REFERENCES auth.users(id),
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view all email logs
CREATE POLICY "Admins can view all email logs"
ON public.email_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'gestor')
  )
);

-- Users can view their own email logs
CREATE POLICY "Users can view their own email logs"
ON public.email_logs
FOR SELECT
USING (recipient_user_id = auth.uid());

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON public.email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);