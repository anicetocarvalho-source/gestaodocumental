
-- =============== STORAGE LOCATIONS ===============
CREATE TABLE public.storage_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  code text NOT NULL,
  name text NOT NULL,
  location_type text NOT NULL CHECK (location_type IN ('deposito','sala','estante','prateleira','caixa')),
  parent_id uuid REFERENCES public.storage_locations(id) ON DELETE RESTRICT,
  level integer NOT NULL DEFAULT 1,
  path text,
  capacity integer,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX storage_locations_org_code_key ON public.storage_locations(organization_id, code);
CREATE INDEX storage_locations_parent_idx ON public.storage_locations(parent_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.storage_locations TO authenticated;
GRANT ALL ON public.storage_locations TO service_role;
ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "storage_locations_select" ON public.storage_locations FOR SELECT TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "storage_locations_insert" ON public.storage_locations FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','gestor','tecnico']::app_role[]));
CREATE POLICY "storage_locations_update" ON public.storage_locations FOR UPDATE TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) AND public.has_any_role(auth.uid(), ARRAY['admin','gestor','tecnico']::app_role[]));
CREATE POLICY "storage_locations_delete" ON public.storage_locations FOR DELETE TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) AND public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[]));

CREATE TRIGGER set_org_id_storage_locations BEFORE INSERT ON public.storage_locations
FOR EACH ROW EXECUTE FUNCTION public.set_organization_id_from_user();
CREATE TRIGGER update_storage_locations_updated_at BEFORE UPDATE ON public.storage_locations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_storage_locations AFTER INSERT OR UPDATE OR DELETE ON public.storage_locations
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- compute level + path automatically
CREATE OR REPLACE FUNCTION public.set_storage_location_path()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_path text;
  parent_level integer;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.level := 1;
    NEW.path := NEW.name;
  ELSE
    SELECT path, level INTO parent_path, parent_level FROM public.storage_locations WHERE id = NEW.parent_id;
    NEW.level := COALESCE(parent_level, 0) + 1;
    NEW.path := COALESCE(parent_path, '') || ' > ' || NEW.name;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_storage_location_path_trigger BEFORE INSERT OR UPDATE OF parent_id, name
ON public.storage_locations FOR EACH ROW EXECUTE FUNCTION public.set_storage_location_path();

-- location code counters
CREATE TABLE public.location_counters (
  organization_id uuid NOT NULL,
  location_type text NOT NULL,
  counter integer NOT NULL DEFAULT 0,
  PRIMARY KEY (organization_id, location_type)
);
GRANT ALL ON public.location_counters TO service_role;
ALTER TABLE public.location_counters ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_next_location_code(org_id uuid, ltype text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_val integer;
  prefix text;
BEGIN
  prefix := CASE ltype
    WHEN 'deposito' THEN 'DEP'
    WHEN 'sala' THEN 'SAL'
    WHEN 'estante' THEN 'EST'
    WHEN 'prateleira' THEN 'PRA'
    WHEN 'caixa' THEN 'CX'
    ELSE 'LOC'
  END;

  INSERT INTO public.location_counters (organization_id, location_type, counter)
  VALUES (org_id, ltype, 1)
  ON CONFLICT (organization_id, location_type)
  DO UPDATE SET counter = location_counters.counter + 1
  RETURNING counter INTO next_val;

  RETURN format('%s-%s', prefix, lpad(next_val::text, 4, '0'));
END;
$$;

-- =============== DOCUMENT CURRENT LOCATION ===============
CREATE TABLE public.document_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.storage_locations(id) ON DELETE SET NULL,
  physical_status text NOT NULL DEFAULT 'arquivado' CHECK (physical_status IN ('arquivado','emprestado','em_transito','em_falta')),
  placed_by uuid,
  placed_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX document_locations_document_key ON public.document_locations(document_id);
CREATE INDEX document_locations_location_idx ON public.document_locations(location_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_locations TO authenticated;
GRANT ALL ON public.document_locations TO service_role;
ALTER TABLE public.document_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_locations_select" ON public.document_locations FOR SELECT TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "document_locations_insert" ON public.document_locations FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','gestor','tecnico']::app_role[]));
CREATE POLICY "document_locations_update" ON public.document_locations FOR UPDATE TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) AND public.has_any_role(auth.uid(), ARRAY['admin','gestor','tecnico']::app_role[]));
CREATE POLICY "document_locations_delete" ON public.document_locations FOR DELETE TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) AND public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[]));

CREATE TRIGGER set_org_id_document_locations BEFORE INSERT ON public.document_locations
FOR EACH ROW EXECUTE FUNCTION public.set_organization_id_from_user();
CREATE TRIGGER update_document_locations_updated_at BEFORE UPDATE ON public.document_locations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== PHYSICAL MOVEMENTS (immutable) ===============
CREATE TABLE public.physical_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  location_container_id uuid REFERENCES public.storage_locations(id) ON DELETE SET NULL,
  from_location_id uuid REFERENCES public.storage_locations(id) ON DELETE SET NULL,
  to_location_id uuid REFERENCES public.storage_locations(id) ON DELETE SET NULL,
  movement_type text NOT NULL CHECK (movement_type IN ('entrada','saida','devolucao','transferencia','arquivo')),
  to_user_id uuid,
  reason text,
  notes text,
  scanned_qr boolean NOT NULL DEFAULT false,
  performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX physical_movements_document_idx ON public.physical_movements(document_id, created_at DESC);
CREATE INDEX physical_movements_created_idx ON public.physical_movements(created_at DESC);

GRANT SELECT, INSERT ON public.physical_movements TO authenticated;
GRANT ALL ON public.physical_movements TO service_role;
ALTER TABLE public.physical_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "physical_movements_select" ON public.physical_movements FOR SELECT TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "physical_movements_insert" ON public.physical_movements FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','gestor','tecnico']::app_role[]));

CREATE TRIGGER set_org_id_physical_movements BEFORE INSERT ON public.physical_movements
FOR EACH ROW EXECUTE FUNCTION public.set_organization_id_from_user();
CREATE TRIGGER audit_physical_movements AFTER INSERT ON public.physical_movements
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- =============== LOANS ===============
CREATE TABLE public.document_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  borrower_user_id uuid,
  borrower_unit_id uuid REFERENCES public.organizational_units(id),
  borrower_name text,
  reason text,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'activo' CHECK (status IN ('activo','devolvido')),
  origin_location_id uuid REFERENCES public.storage_locations(id) ON DELETE SET NULL,
  returned_location_id uuid REFERENCES public.storage_locations(id) ON DELETE SET NULL,
  return_notes text,
  loaned_by uuid,
  loaned_at timestamptz NOT NULL DEFAULT now(),
  returned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX document_loans_status_idx ON public.document_loans(status, due_date);
CREATE INDEX document_loans_document_idx ON public.document_loans(document_id);

GRANT SELECT, INSERT, UPDATE ON public.document_loans TO authenticated;
GRANT ALL ON public.document_loans TO service_role;
ALTER TABLE public.document_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_loans_select" ON public.document_loans FOR SELECT TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "document_loans_insert" ON public.document_loans FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','gestor','tecnico']::app_role[]));
CREATE POLICY "document_loans_update" ON public.document_loans FOR UPDATE TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) AND public.has_any_role(auth.uid(), ARRAY['admin','gestor','tecnico']::app_role[]));

CREATE TRIGGER set_org_id_document_loans BEFORE INSERT ON public.document_loans
FOR EACH ROW EXECUTE FUNCTION public.set_organization_id_from_user();
CREATE TRIGGER update_document_loans_updated_at BEFORE UPDATE ON public.document_loans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_document_loans AFTER INSERT OR UPDATE ON public.document_loans
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- =============== API KEYS / WEBHOOKS ===============
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  scopes text[] NOT NULL DEFAULT ARRAY['read']::text[],
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX api_keys_hash_key ON public.api_keys(key_hash);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_select" ON public.api_keys FOR SELECT TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) AND public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[]));
CREATE POLICY "api_keys_insert" ON public.api_keys FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[]));
CREATE POLICY "api_keys_update" ON public.api_keys FOR UPDATE TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) AND public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[]));
CREATE POLICY "api_keys_delete" ON public.api_keys FOR DELETE TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_org_id_api_keys BEFORE INSERT ON public.api_keys
FOR EACH ROW EXECUTE FUNCTION public.set_organization_id_from_user();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_api_keys AFTER INSERT OR UPDATE OR DELETE ON public.api_keys
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TABLE public.api_key_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  api_key_id uuid REFERENCES public.api_keys(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  method text NOT NULL,
  status_code integer,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX api_key_logs_key_idx ON public.api_key_logs(api_key_id, created_at DESC);

GRANT SELECT ON public.api_key_logs TO authenticated;
GRANT ALL ON public.api_key_logs TO service_role;
ALTER TABLE public.api_key_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_key_logs_select" ON public.api_key_logs FOR SELECT TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) AND public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[]));

CREATE TABLE public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  name text NOT NULL,
  url text NOT NULL,
  events text[] NOT NULL DEFAULT ARRAY['movement.created']::text[],
  secret text,
  is_active boolean NOT NULL DEFAULT true,
  last_delivery_at timestamptz,
  last_delivery_status integer,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_endpoints TO authenticated;
GRANT ALL ON public.webhook_endpoints TO service_role;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_endpoints_select" ON public.webhook_endpoints FOR SELECT TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) AND public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[]));
CREATE POLICY "webhook_endpoints_insert" ON public.webhook_endpoints FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[]));
CREATE POLICY "webhook_endpoints_update" ON public.webhook_endpoints FOR UPDATE TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) AND public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[]));
CREATE POLICY "webhook_endpoints_delete" ON public.webhook_endpoints FOR DELETE TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_org_id_webhook_endpoints BEFORE INSERT ON public.webhook_endpoints
FOR EACH ROW EXECUTE FUNCTION public.set_organization_id_from_user();
CREATE TRIGGER update_webhook_endpoints_updated_at BEFORE UPDATE ON public.webhook_endpoints
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
