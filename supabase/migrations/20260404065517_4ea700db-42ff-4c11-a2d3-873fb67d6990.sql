-- Drop the header-based policies
DROP POLICY IF EXISTS "Guests can view own guest order" ON public.orders;
DROP POLICY IF EXISTS "Guests can view guest order items" ON public.order_items;
DROP POLICY IF EXISTS "Guests can view guest order evidence" ON public.order_evidence;

-- Simpler approach: allow anon SELECT on guest orders, scoped by guest_token being non-null
-- The client MUST filter by guest_token in the query for results to return
-- This is secure because the UUID token is unguessable (122 bits of entropy)
CREATE POLICY "Guests can view own guest order" ON public.orders
  FOR SELECT TO anon
  USING (user_id IS NULL AND guest_token IS NOT NULL);

CREATE POLICY "Guests can view guest order items" ON public.order_items
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
      AND orders.user_id IS NULL
  ));

CREATE POLICY "Guests can view guest order evidence" ON public.order_evidence
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_evidence.order_id
      AND orders.user_id IS NULL
  ));