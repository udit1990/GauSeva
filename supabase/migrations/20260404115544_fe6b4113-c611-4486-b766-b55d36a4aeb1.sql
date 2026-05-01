
-- Replace volunteer ALL policy with scoped INSERT + SELECT
DROP POLICY IF EXISTS "Volunteers can manage evidence for assigned orders" ON public.order_evidence;

CREATE POLICY "Volunteers can insert evidence for assigned orders"
  ON public.order_evidence FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_evidence.order_id
        AND orders.assigned_volunteer = auth.uid()
    )
  );

CREATE POLICY "Volunteers can view evidence for assigned orders"
  ON public.order_evidence FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_evidence.order_id
        AND orders.assigned_volunteer = auth.uid()
    )
  );
