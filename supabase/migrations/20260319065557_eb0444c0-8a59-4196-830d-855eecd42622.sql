-- Add gaushala_id to profiles for 1:1 volunteer-gaushala mapping
ALTER TABLE public.profiles ADD COLUMN gaushala_id uuid REFERENCES public.gaushalas_list(id) ON DELETE SET NULL;

-- Create change requests table
CREATE TABLE public.gaushala_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_gaushala_id uuid REFERENCES public.gaushalas_list(id) ON DELETE SET NULL,
  requested_gaushala_id uuid NOT NULL REFERENCES public.gaushalas_list(id) ON DELETE CASCADE,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gaushala_change_requests ENABLE ROW LEVEL SECURITY;

-- Volunteers can view own requests
CREATE POLICY "Volunteers can view own change requests"
ON public.gaushala_change_requests FOR SELECT
TO authenticated
USING (auth.uid() = volunteer_id);

-- Volunteers can insert own requests
CREATE POLICY "Volunteers can insert change requests"
ON public.gaushala_change_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = volunteer_id);

-- Admins can manage all change requests
CREATE POLICY "Admins can manage change requests"
ON public.gaushala_change_requests FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));