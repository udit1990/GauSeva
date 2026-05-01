
-- =============================================
-- 1A. STORAGE POLICIES: Drop all 7 existing order-evidence policies
-- =============================================
DROP POLICY IF EXISTS "Anyone can view evidence files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete evidence" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can read evidence" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage evidence files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete evidence files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload evidence" ON storage.objects;
DROP POLICY IF EXISTS "Volunteers can upload evidence" ON storage.objects;

-- CREATE 4 clean RBAC policies
CREATE POLICY "Admin full access to evidence"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'order-evidence' AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'order-evidence' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Volunteer upload evidence for assigned orders"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'order-evidence'
    AND public.has_role(auth.uid(), 'volunteer'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.assigned_volunteer = auth.uid()
        AND orders.id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Volunteer read evidence for assigned orders"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'order-evidence'
    AND public.has_role(auth.uid(), 'volunteer'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.assigned_volunteer = auth.uid()
        AND orders.id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Authenticated read approved evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'order-evidence'
    AND EXISTS (
      SELECT 1 FROM public.order_evidence oe
      WHERE oe.storage_path = name
        AND oe.status = 'approved'
    )
  );

-- =============================================
-- 1B. GUEST RLS: Tighten guest order_items policies
-- =============================================
DROP POLICY IF EXISTS "Guests can view guest order items" ON public.order_items;
CREATE POLICY "Guests can view guest order items"
  ON public.order_items FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id IS NULL
        AND orders.guest_token IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Guests can insert order items" ON public.order_items;
CREATE POLICY "Guests can insert order items"
  ON public.order_items FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id IS NULL
        AND orders.guest_token IS NOT NULL
    )
  );

-- =============================================
-- 1C. REALTIME: Remove PII-sensitive tables
-- =============================================
ALTER PUBLICATION supabase_realtime DROP TABLE orders;
ALTER PUBLICATION supabase_realtime DROP TABLE visit_bookings;

-- =============================================
-- 1F. SEVA_IMAGES: Restrict writes to admin only
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can insert seva images" ON public.seva_images;
CREATE POLICY "Admins can insert seva images"
  ON public.seva_images FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can update seva images" ON public.seva_images;
CREATE POLICY "Admins can update seva images"
  ON public.seva_images FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can delete seva images" ON public.seva_images;
CREATE POLICY "Admins can delete seva images"
  ON public.seva_images FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
