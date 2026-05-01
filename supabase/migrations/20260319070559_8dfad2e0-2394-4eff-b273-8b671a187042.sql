-- Function to auto-assign volunteer based on gaushala tag
CREATE OR REPLACE FUNCTION public.auto_assign_volunteer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _volunteer_id uuid;
BEGIN
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
$$;

-- Trigger for orders
CREATE TRIGGER trg_auto_assign_order_volunteer
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_volunteer();

-- Trigger for visit_bookings
CREATE TRIGGER trg_auto_assign_visit_volunteer
  BEFORE INSERT ON public.visit_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_volunteer();