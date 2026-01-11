-- Add email notification preferences for retention alerts
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS email_retention_alerts boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS email_retention_urgent_only boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_digest_frequency text DEFAULT 'daily' CHECK (email_digest_frequency IN ('daily', 'weekly', 'never'));