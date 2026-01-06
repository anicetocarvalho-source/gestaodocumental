-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  -- Notification types
  movement_despacho BOOLEAN NOT NULL DEFAULT true,
  movement_encaminhamento BOOLEAN NOT NULL DEFAULT true,
  movement_recebimento BOOLEAN NOT NULL DEFAULT true,
  movement_devolucao BOOLEAN NOT NULL DEFAULT true,
  movement_arquivamento BOOLEAN NOT NULL DEFAULT true,
  -- Delivery settings
  show_toast BOOLEAN NOT NULL DEFAULT true,
  play_sound BOOLEAN NOT NULL DEFAULT false,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view their own preferences"
ON public.notification_preferences
FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own preferences"
ON public.notification_preferences
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can update their own preferences"
ON public.notification_preferences
FOR UPDATE
USING (user_id = auth.uid());

-- Create index
CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update the movement notification function to check preferences
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
  to_user_auth_id UUID;
  action_label TEXT;
  pref_column TEXT;
  should_notify BOOLEAN;
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

  -- Determine preference column name
  pref_column := 'movement_' || NEW.action_type;

  -- If there's a specific user, notify them
  IF NEW.to_user_id IS NOT NULL THEN
    -- Get the user_id from profiles
    SELECT id, user_id INTO to_user_profile, to_user_auth_id
    FROM public.profiles
    WHERE id = NEW.to_user_id;

    IF to_user_auth_id IS NOT NULL THEN
      -- Check user preferences
      EXECUTE format(
        'SELECT COALESCE((SELECT %I FROM public.notification_preferences WHERE user_id = $1), true)',
        pref_column
      ) INTO should_notify USING to_user_auth_id;

      IF should_notify THEN
        INSERT INTO public.notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (
          to_user_auth_id,
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
    END IF;
  ELSE
    -- Notify all users in the destination unit who have preferences enabled
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
    LEFT JOIN public.notification_preferences np ON np.user_id = p.user_id
    WHERE p.unit_id = NEW.to_unit_id
      AND p.is_active = true
      AND (
        np.id IS NULL -- No preferences = all notifications enabled
        OR (
          CASE NEW.action_type
            WHEN 'despacho' THEN np.movement_despacho
            WHEN 'encaminhamento' THEN np.movement_encaminhamento
            WHEN 'recebimento' THEN np.movement_recebimento
            WHEN 'devolucao' THEN np.movement_devolucao
            WHEN 'arquivamento' THEN np.movement_arquivamento
            ELSE true
          END
        )
      );
  END IF;

  RETURN NEW;
END;
$$;