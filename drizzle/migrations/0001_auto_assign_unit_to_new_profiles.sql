-- Ensure every new profile automatically receives an organization and an organizational unit
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  default_org uuid;
  default_unit uuid;
BEGIN
  SELECT id INTO default_org FROM public.organizations ORDER BY created_at LIMIT 1;

  IF default_org IS NOT NULL THEN
    SELECT id INTO default_unit
    FROM public.organizational_units
    WHERE organization_id = default_org
      AND code = 'DEP-EXP'
    LIMIT 1;

    IF default_unit IS NULL THEN
      SELECT id INTO default_unit
      FROM public.organizational_units
      WHERE organization_id = default_org
      ORDER BY created_at
      LIMIT 1;
    END IF;
  END IF;

  INSERT INTO public.profiles (user_id, full_name, email, organization_id, unit_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email,
    default_org,
    default_unit
  );
  RETURN NEW;
END;
$function$;

-- Backfill any existing profile without a unit
UPDATE public.profiles p
SET unit_id = COALESCE(
      (SELECT u.id FROM public.organizational_units u
        WHERE u.organization_id = COALESCE(p.organization_id, (SELECT id FROM public.organizations ORDER BY created_at LIMIT 1))
          AND u.code = 'DEP-EXP' LIMIT 1),
      (SELECT u.id FROM public.organizational_units u
        WHERE u.organization_id = COALESCE(p.organization_id, (SELECT id FROM public.organizations ORDER BY created_at LIMIT 1))
        ORDER BY u.created_at LIMIT 1)
    ),
    organization_id = COALESCE(p.organization_id, (SELECT id FROM public.organizations ORDER BY created_at LIMIT 1))
WHERE p.unit_id IS NULL;