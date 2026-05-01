-- Allow anonymous (guest) users to insert orders without user_id
CREATE POLICY "Guests can insert orders"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- Allow anonymous users to insert order items for guest orders  
CREATE POLICY "Guests can insert order items"
ON public.order_items
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id IS NULL
  )
);