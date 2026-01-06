-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  reference_type TEXT,
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (user_id = auth.uid());

-- System can insert notifications (via service role or triggers)
CREATE POLICY "Allow insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to auto-create notifications on document movements
CREATE OR REPLACE FUNCTION public.create_movement_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doc_title TEXT;
  doc_entry TEXT;
  to_user_profile UUID;
  action_label TEXT;
BEGIN
  -- Get document info
  SELECT title, entry_number INTO doc_title, doc_entry
  FROM public.documents
  WHERE id = NEW.document_id;

  -- Get action label
  action_label := CASE NEW.action_type
    WHEN 'despacho' THEN 'Despacho'
    WHEN 'encaminhamento' THEN 'Encaminhamento'
    WHEN 'recebimento' THEN 'Recebimento'
    WHEN 'devolucao' THEN 'Devolução'
    WHEN 'arquivamento' THEN 'Arquivamento'
    ELSE NEW.action_type
  END;

  -- If there's a specific user, notify them
  IF NEW.to_user_id IS NOT NULL THEN
    -- Get the user_id from profiles
    SELECT user_id INTO to_user_profile
    FROM public.profiles
    WHERE id = NEW.to_user_id;

    IF to_user_profile IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, reference_type, reference_id)
      VALUES (
        to_user_profile,
        action_label || ': ' || doc_entry,
        'Documento "' || doc_title || '" foi encaminhado para si.',
        CASE 
          WHEN NEW.action_type IN ('despacho', 'encaminhamento') THEN 'movement'
          WHEN NEW.action_type = 'devolucao' THEN 'warning'
          ELSE 'info'
        END,
        'document',
        NEW.document_id
      );
    END IF;
  ELSE
    -- Notify all users in the destination unit
    INSERT INTO public.notifications (user_id, title, message, type, reference_type, reference_id)
    SELECT 
      p.user_id,
      action_label || ': ' || doc_entry,
      'Documento "' || doc_title || '" foi encaminhado para a sua unidade.',
      CASE 
        WHEN NEW.action_type IN ('despacho', 'encaminhamento') THEN 'movement'
        WHEN NEW.action_type = 'devolucao' THEN 'warning'
        ELSE 'info'
      END,
      'document',
      NEW.document_id
    FROM public.profiles p
    WHERE p.unit_id = NEW.to_unit_id
      AND p.is_active = true;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for movement notifications
CREATE TRIGGER on_document_movement_created
  AFTER INSERT ON public.document_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.create_movement_notification();