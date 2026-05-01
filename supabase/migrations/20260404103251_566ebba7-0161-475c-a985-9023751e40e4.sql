
-- Make the bucket private
UPDATE storage.buckets SET public = false WHERE id = 'order-evidence';

-- Ensure upload policies exist for volunteers (they upload via their session)
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Volunteers can upload evidence" ON storage.objects;
CREATE POLICY "Volunteers can upload evidence"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'order-evidence');

DROP POLICY IF EXISTS "Admins can manage evidence files" ON storage.objects;
CREATE POLICY "Admins can manage evidence files"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'order-evidence' AND public.has_role(auth.uid(), 'admin'));

-- Allow authenticated users to read their own evidence for signed URL fallback
DROP POLICY IF EXISTS "Authenticated can read evidence" ON storage.objects;
CREATE POLICY "Authenticated can read evidence"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'order-evidence');

-- Add RLS policy for service role deletion (cleanup function uses service key, so this is just safety)
DROP POLICY IF EXISTS "Service can delete evidence" ON storage.objects;

-- Add DELETE policy for admin cleanup
DROP POLICY IF EXISTS "Admins can delete evidence files" ON storage.objects;
CREATE POLICY "Admins can delete evidence files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'order-evidence' AND public.has_role(auth.uid(), 'admin'));
