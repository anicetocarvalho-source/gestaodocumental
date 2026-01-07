-- Fix the function to notify when approval status changes
CREATE OR REPLACE FUNCTION public.notify_dispatch_approval_result()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  dispatch_number TEXT;
  dispatch_subject TEXT;
  creator_auth_id UUID;
  status_label TEXT;
BEGIN
  -- Only trigger on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get dispatch info
  SELECT d.dispatch_number, d.subject INTO dispatch_number, dispatch_subject
  FROM public.dispatches d
  WHERE d.id = NEW.dispatch_id;

  -- Get creator auth id
  SELECT p.user_id INTO creator_auth_id
  FROM public.dispatches d
  JOIN public.profiles p ON p.id = d.created_by
  WHERE d.id = NEW.dispatch_id;

  -- Status label
  status_label := CASE NEW.status
    WHEN 'aprovado' THEN 'aprovado'
    WHEN 'rejeitado' THEN 'rejeitado'
    WHEN 'devolvido' THEN 'devolvido para revisão'
    ELSE NEW.status::text
  END;

  -- Notify the dispatch creator
  IF creator_auth_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (
      creator_auth_id,
      'Despacho ' || UPPER(LEFT(status_label, 1)) || SUBSTRING(status_label FROM 2) || ': ' || dispatch_number,
      'O despacho "' || dispatch_subject || '" foi ' || status_label || '.',
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'success'
        WHEN NEW.status = 'rejeitado' THEN 'error'
        ELSE 'warning'
      END,
      'dispatch',
      NEW.dispatch_id
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Create the missing trigger for approval status changes
CREATE TRIGGER on_dispatch_approval_status_changed
  AFTER UPDATE ON public.dispatch_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_dispatch_approval_result();