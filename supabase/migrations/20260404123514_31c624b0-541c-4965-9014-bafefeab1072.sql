
-- 1. Create SECURITY DEFINER RPC that validates guest_token
CREATE OR REPLACE FUNCTION public.get_guest_order(_order_id uuid, _guest_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order jsonb;
  _items jsonb;
  _evidence jsonb;
BEGIN
  SELECT to_jsonb(o.*) INTO _order
  FROM orders o
  WHERE o.id = _order_id
    AND o.user_id IS NULL
    AND o.guest_token = _guest_token;

  IF _order IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(oi.*)), '[]'::jsonb) INTO _items
  FROM order_items oi
  WHERE oi.order_id = _order_id;

  SELECT COALESCE(jsonb_agg(to_jsonb(oe.*)), '[]'::jsonb) INTO _evidence
  FROM order_evidence oe
  WHERE oe.order_id = _order_id
    AND oe.status = 'approved';

  RETURN jsonb_build_object(
    'order', _order,
    'order_items', _items,
    'order_evidence', _evidence
  );
END;
$$;

-- 2. Drop the overly-permissive anon SELECT policies
DROP POLICY IF EXISTS "Guests can view own guest order" ON public.orders;
DROP POLICY IF EXISTS "Guests can view guest order items" ON public.order_items;
DROP POLICY IF EXISTS "Guests can view approved guest order evidence" ON public.order_evidence;
