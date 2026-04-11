
CREATE OR REPLACE FUNCTION public.audit_document_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.document_audit_log (document_id, action, description, new_values, performed_by)
        VALUES (NEW.id, 'create', 'Documento criado', to_jsonb(NEW), NEW.created_by);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            INSERT INTO public.document_audit_log (document_id, action, description, old_values, new_values, performed_by)
            VALUES (NEW.id, 'status_change', 'Estado alterado de ' || OLD.status || ' para ' || NEW.status, 
                    jsonb_build_object('status', OLD.status), 
                    jsonb_build_object('status', NEW.status), 
                    NEW.created_by);
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.audit_process_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.process_audit_log (process_id, action, description, new_values, performed_by)
    VALUES (NEW.id, 'create', 'Processo criado', to_jsonb(NEW), NEW.created_by);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.process_audit_log (process_id, action, description, old_values, new_values, performed_by)
      VALUES (NEW.id, 'status_change', 'Estado alterado de ' || OLD.status || ' para ' || NEW.status, 
              jsonb_build_object('status', OLD.status), 
              jsonb_build_object('status', NEW.status), 
              NEW.created_by);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.audit_dispatch_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.dispatch_audit_log (dispatch_id, action, description, new_values, performed_by)
    VALUES (NEW.id, 'create', 'Despacho criado', to_jsonb(NEW), NEW.created_by);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.dispatch_audit_log (dispatch_id, action, description, old_values, new_values, performed_by)
      VALUES (NEW.id, 'status_change', 'Estado alterado de ' || OLD.status || ' para ' || NEW.status, 
              jsonb_build_object('status', OLD.status), 
              jsonb_build_object('status', NEW.status), 
              NEW.created_by);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;
