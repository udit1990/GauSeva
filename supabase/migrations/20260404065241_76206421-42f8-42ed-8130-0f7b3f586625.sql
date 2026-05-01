-- Add guest_token column to orders
ALTER TABLE public.orders ADD COLUMN guest_token uuid DEFAULT NULL;

-- Backfill existing guest orders with a token
UPDATE public.orders SET guest_token = gen_random_uuid() WHERE user_id IS NULL AND guest_token IS NULL;

-- Drop the overly broad guest SELECT policy
DROP POLICY IF EXISTS "Guests can view guest orders" ON public.orders;

-- New scoped policy: anon can only SELECT a guest order by matching guest_token passed as RPC param
-- We use a custom claim header approach: the client passes the token as a query filter
-- The policy just ensures anon can only see orders where user_id IS NULL (the actual scoping is done by the client query filter on guest_token)
-- Actually, the safest approach: only allow SELECT when the guest_token matches
CREATE POLICY "Guests can view own guest order" ON public.orders
  FOR SELECT TO anon
  USING (user_id IS NULL AND guest_token IS NOT NULL AND guest_token = (current_setting('request.headers', true)::json->>'x-guest-token')::uuid);

-- Guest order_items SELECT
CREATE POLICY "Guests can view guest order items" ON public.order_items
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
      AND orders.user_id IS NULL
      AND orders.guest_token IS NOT NULL
      AND orders.guest_token = (current_setting('request.headers', true)::json->>'x-guest-token')::uuid
  ));

-- Guest order_evidence SELECT
CREATE POLICY "Guests can view guest order evidence" ON public.order_evidence
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_evidence.order_id
      AND orders.user_id IS NULL
      AND orders.guest_token IS NOT NULL
      AND orders.guest_token = (current_setting('request.headers', true)::json->>'x-guest-token')::uuid
  ));