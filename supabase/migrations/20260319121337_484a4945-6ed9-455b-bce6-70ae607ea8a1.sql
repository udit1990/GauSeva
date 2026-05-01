
CREATE OR REPLACE FUNCTION public.auto_assign_volunteer()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _volunteer_id uuid;
  _flag_enabled boolean;
BEGIN
  -- Check feature flag
  SELECT enabled INTO _flag_enabled
  FROM public.feature_flags
  WHERE id = 'auto_assign_volunteers';

  IF _flag_enabled IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  -- Only assign if gaushala_id is set and no volunteer already assigned
  IF NEW.gaushala_id IS NOT NULL AND NEW.assigned_volunteer IS NULL THEN
    SELECT p.id INTO _volunteer_id
    FROM public.profiles p
    INNER JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.gaushala_id = NEW.gaushala_id
      AND ur.role = 'volunteer'
      AND p.is_available = true
    LIMIT 1;

    IF _volunteer_id IS NOT NULL THEN
      NEW.assigned_volunteer := _volunteer_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
