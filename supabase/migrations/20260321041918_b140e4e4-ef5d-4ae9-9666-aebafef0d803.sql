-- Allow guests to view orders where user_id is null (for payment page)
CREATE POLICY "Guests can view guest orders"
ON public.orders
FOR SELECT
TO anon
USING (user_id IS NULL);