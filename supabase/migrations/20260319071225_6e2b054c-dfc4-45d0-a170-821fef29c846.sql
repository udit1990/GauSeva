-- Drop the overly permissive insert policy
DROP POLICY "System can insert audit logs" ON public.assignment_audit_log;

-- Only admins can insert (manual overrides go through admin context)
-- Auto-inserts bypass RLS via SECURITY DEFINER trigger function
CREATE POLICY "Admins can insert audit logs"
ON public.assignment_audit_log FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));