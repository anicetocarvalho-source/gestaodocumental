
-- Fix the trigger to handle English action_type values used in document_movements
CREATE OR REPLACE FUNCTION create_movement_notification()
RETURNS TRIGGER AS $$
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

  -- Get action label (handles both English and Portuguese action types)
  action_label := CASE NEW.action_type
    WHEN 'dispatch' THEN 'Despacho'
    WHEN 'despacho' THEN 'Despacho'
    WHEN 'forward' THEN 'Encaminhamento'
    WHEN 'encaminhamento' THEN 'Encaminhamento'
    WHEN 'receive' THEN 'Recebimento'
    WHEN 'recebimento' THEN 'Recebimento'
    WHEN 'return' THEN 'Devolução'
    WHEN 'devolucao' THEN 'Devolução'
    WHEN 'archive' THEN 'Arquivamento'
    WHEN 'arquivamento' THEN 'Arquivamento'
    WHEN 'validate' THEN 'Validação'
    WHEN 'assign' THEN 'Atribuição'
    WHEN 'reject' THEN 'Rejeição'
    WHEN 'sign' THEN 'Assinatura'
    ELSE NEW.action_type
  END;

  -- Map action_type to preference column (always use Portuguese column names)
  pref_column := CASE NEW.action_type
    WHEN 'dispatch' THEN 'movement_despacho'
    WHEN 'despacho' THEN 'movement_despacho'
    WHEN 'forward' THEN 'movement_encaminhamento'
    WHEN 'encaminhamento' THEN 'movement_encaminhamento'
    WHEN 'receive' THEN 'movement_recebimento'
    WHEN 'recebimento' THEN 'movement_recebimento'
    WHEN 'return' THEN 'movement_devolucao'
    WHEN 'devolucao' THEN 'movement_devolucao'
    WHEN 'archive' THEN 'movement_arquivamento'
    WHEN 'arquivamento' THEN 'movement_arquivamento'
    ELSE 'movement_recebimento' -- default fallback
  END;

  -- If there's a specific user, notify them
  IF NEW.to_user_id IS NOT NULL THEN
    SELECT id, user_id INTO to_user_profile, to_user_auth_id
    FROM public.profiles
    WHERE id = NEW.to_user_id;

    IF to_user_auth_id IS NOT NULL THEN
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
            WHEN NEW.action_type IN ('dispatch', 'despacho', 'forward', 'encaminhamento') THEN 'movement'
            WHEN NEW.action_type IN ('return', 'devolucao', 'reject') THEN 'warning'
            ELSE 'info'
          END,
          'document',
          NEW.document_id
        );
      END IF;
    END IF;
  ELSE
    INSERT INTO public.notifications (user_id, title, message, type, reference_type, reference_id)
    SELECT 
      p.user_id,
      action_label || ': ' || doc_entry,
      'Documento "' || doc_title || '" foi encaminhado para a sua unidade.',
      CASE 
        WHEN NEW.action_type IN ('dispatch', 'despacho', 'forward', 'encaminhamento') THEN 'movement'
        WHEN NEW.action_type IN ('return', 'devolucao', 'reject') THEN 'warning'
        ELSE 'info'
      END,
      'document',
      NEW.document_id
    FROM public.profiles p
    LEFT JOIN public.notification_preferences np ON np.user_id = p.user_id
    WHERE p.unit_id = NEW.to_unit_id
      AND p.is_active = true
      AND (
        np.id IS NULL
        OR (
          CASE NEW.action_type
            WHEN 'dispatch' THEN np.movement_despacho
            WHEN 'despacho' THEN np.movement_despacho
            WHEN 'forward' THEN np.movement_encaminhamento
            WHEN 'encaminhamento' THEN np.movement_encaminhamento
            WHEN 'receive' THEN np.movement_recebimento
            WHEN 'recebimento' THEN np.movement_recebimento
            WHEN 'return' THEN np.movement_devolucao
            WHEN 'devolucao' THEN np.movement_devolucao
            WHEN 'archive' THEN np.movement_arquivamento
            WHEN 'arquivamento' THEN np.movement_arquivamento
            ELSE true
          END
        )
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
