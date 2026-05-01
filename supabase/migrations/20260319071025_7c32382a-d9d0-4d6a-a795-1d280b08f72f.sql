-- Function to notify volunteer on auto-assignment
CREATE OR REPLACE FUNCTION public.notify_volunteer_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _table_type text;
  _title text;
  _body text;
  _notif_type text;
  _donor_name text;
  _visitor_name text;
  _gaushala_name text;
BEGIN
  -- Only fire if assigned_volunteer was set (from NULL)
  IF NEW.assigned_volunteer IS NULL THEN
    RETURN NEW;
  END IF;
  IF OLD IS NOT NULL AND OLD.assigned_volunteer IS NOT DISTINCT FROM NEW.assigned_volunteer THEN
    RETURN NEW;
  END IF;

  -- Get gaushala name
  SELECT name INTO _gaushala_name FROM public.gaushalas_list WHERE id = NEW.gaushala_id;

  IF TG_TABLE_NAME = 'orders' THEN
    _title := 'New Order Assigned';
    _body := 'Order from ' || NEW.donor_name || ' (₹' || NEW.total_amount::text || ')' || COALESCE(' at ' || _gaushala_name, '');
    _notif_type := 'order';
  ELSIF TG_TABLE_NAME = 'visit_bookings' THEN
    _title := 'New Visit Assigned';
    _body := 'Visit by ' || NEW.visitor_name || ' on ' || NEW.visit_date::text || COALESCE(' at ' || _gaushala_name, '');
    _notif_type := 'visit';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, title, body, type, metadata)
  VALUES (
    NEW.assigned_volunteer,
    _title,
    _body,
    _notif_type,
    jsonb_build_object('id', NEW.id, 'table', TG_TABLE_NAME)
  );

  RETURN NEW;
END;
$$;

-- Trigger on orders (AFTER INSERT OR UPDATE so the row is committed)
CREATE TRIGGER trg_notify_order_assignment
  AFTER INSERT OR UPDATE OF assigned_volunteer ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_volunteer_assignment();

-- Trigger on visit_bookings
CREATE TRIGGER trg_notify_visit_assignment
  AFTER INSERT OR UPDATE OF assigned_volunteer ON public.visit_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_volunteer_assignment();