CREATE OR REPLACE FUNCTION public.notify_protocol_entry_registered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  label text;
BEGIN
  label := CASE NEW.direction WHEN 'entrada' THEN 'Entrada de correspondência' ELSE 'Saída de correspondência' END;

  IF NEW.unit_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, reference_type, reference_id)
    SELECT p.user_id,
           label || ': ' || NEW.protocol_number,
           'Assunto: "' || NEW.subject || '". Registo de protocolo atribuído à sua unidade.',
           'info',
           'protocol',
           NEW.id
    FROM public.profiles p
    WHERE p.unit_id = NEW.unit_id
      AND p.is_active = true
      AND p.user_id IS NOT NULL
      AND p.user_id IS DISTINCT FROM NEW.registered_by;
  END IF;

  IF NEW.registered_by IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (
      NEW.registered_by,
      label || ' registada: ' || NEW.protocol_number,
      'O registo "' || NEW.subject || '" foi criado no Livro de Protocolo.',
      'success',
      'protocol',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_protocol_entry_registered ON public.protocol_entries;
CREATE TRIGGER on_protocol_entry_registered
AFTER INSERT ON public.protocol_entries
FOR EACH ROW EXECUTE FUNCTION public.notify_protocol_entry_registered();

CREATE OR REPLACE FUNCTION public.notify_protocol_document_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pe RECORD;
  label text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  label := CASE NEW.status
    WHEN 'received' THEN 'Recebido'
    WHEN 'in_progress' THEN 'Em tramitação'
    WHEN 'dispatched' THEN 'Despachado'
    WHEN 'validated' THEN 'Validado'
    WHEN 'rejected' THEN 'Rejeitado'
    WHEN 'archived' THEN 'Arquivado'
    ELSE NEW.status
  END;

  FOR pe IN
    SELECT * FROM public.protocol_entries WHERE document_id = NEW.id
  LOOP
    IF pe.registered_by IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, reference_type, reference_id)
      VALUES (
        pe.registered_by,
        'Protocolo ' || pe.protocol_number || ': ' || label,
        'O documento associado ao protocolo "' || pe.subject || '" mudou de estado para ' || label || '.',
        CASE WHEN NEW.status = 'rejected' THEN 'warning' WHEN NEW.status = 'archived' THEN 'info' ELSE 'movement' END,
        'protocol',
        pe.id
      );
    END IF;

    IF pe.unit_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, reference_type, reference_id)
      SELECT p.user_id,
             'Protocolo ' || pe.protocol_number || ': ' || label,
             'O documento associado ao protocolo "' || pe.subject || '" mudou de estado para ' || label || '.',
             'movement',
             'protocol',
             pe.id
      FROM public.profiles p
      WHERE p.unit_id = pe.unit_id
        AND p.is_active = true
        AND p.user_id IS NOT NULL
        AND p.user_id IS DISTINCT FROM pe.registered_by;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_document_status_protocol_notify ON public.documents;
CREATE TRIGGER on_document_status_protocol_notify
AFTER UPDATE OF status ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.notify_protocol_document_status();