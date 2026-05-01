
-- Fix certificates: restrict INSERT to own orders only
DROP POLICY IF EXISTS "Users can insert own certificates" ON public.certificates;
CREATE POLICY "Users can insert own certificates"
  ON public.certificates FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = certificates.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Fix seva-images storage bucket policies
DROP POLICY IF EXISTS "Anyone can upload seva images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update seva images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete seva images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload seva images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update seva images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete seva images" ON storage.objects;

CREATE POLICY "Admins can upload seva images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'seva-images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update seva images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'seva-images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete seva images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'seva-images' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Fix approved evidence: scope to order owner
DROP POLICY IF EXISTS "Authenticated read approved evidence" ON storage.objects;
CREATE POLICY "Authenticated read approved evidence for own orders"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'order-evidence'
    AND EXISTS (
      SELECT 1 FROM public.order_evidence oe
      JOIN public.orders o ON o.id = oe.order_id
      WHERE oe.storage_path = name
        AND oe.status = 'approved'
        AND o.user_id = auth.uid()
    )
  );
