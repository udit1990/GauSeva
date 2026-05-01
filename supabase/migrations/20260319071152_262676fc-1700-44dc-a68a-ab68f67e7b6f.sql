-- Assignment audit log table
CREATE TABLE public.assignment_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL, -- 'order' or 'visit'
  entity_id uuid NOT NULL,
  previous_volunteer uuid,
  new_volunteer uuid,
  changed_by uuid, -- NULL for auto-assignment (trigger)
  change_type text NOT NULL DEFAULT 'manual', -- 'auto' or 'manual'
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assignment_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.assignment_audit_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow inserts from triggers (security definer functions)
CREATE POLICY "System can insert audit logs"
ON public.assignment_audit_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- Trigger function to log assignment changes
CREATE OR REPLACE FUNCTION public.log_assignment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _entity_type text;
  _old_volunteer uuid;
  _new_volunteer uuid;
  _change_type text;
  _changed_by uuid;
BEGIN
  _new_volunteer := NEW.assigned_volunteer;

  -- Determine old volunteer
  IF TG_OP = 'INSERT' THEN
    _old_volunteer := NULL;
  ELSE
    _old_volunteer := OLD.assigned_volunteer;
  END IF;

  -- Skip if no change
  IF _old_volunteer IS NOT DISTINCT FROM _new_volunteer THEN
    RETURN NEW;
  END IF;

  -- Skip if new volunteer is NULL (unassignment)
  IF _new_volunteer IS NULL THEN
    RETURN NEW;
  END IF;

  _entity_type := CASE TG_TABLE_NAME
    WHEN 'orders' THEN 'order'
    WHEN 'visit_bookings' THEN 'visit'
  END;

  -- Determine if auto or manual:
  -- Auto = INSERT with volunteer set (from auto_assign trigger)
  -- Manual = UPDATE (admin override)
  IF TG_OP = 'INSERT' THEN
    _change_type := 'auto';
    _changed_by := NULL;
  ELSE
    _change_type := 'manual';
    _changed_by := auth.uid();
  END IF;

  INSERT INTO public.assignment_audit_log (entity_type, entity_id, previous_volunteer, new_volunteer, changed_by, change_type)
  VALUES (_entity_type, NEW.id, _old_volunteer, _new_volunteer, _changed_by, _change_type);

  RETURN NEW;
END;
$$;

-- Triggers
CREATE TRIGGER trg_audit_order_assignment
  AFTER INSERT OR UPDATE OF assigned_volunteer ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_assignment_change();

CREATE TRIGGER trg_audit_visit_assignment
  AFTER INSERT OR UPDATE OF assigned_volunteer ON public.visit_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_assignment_change();