
-- Add 'volunteer' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'volunteer';

-- Create managed gaushalas table
CREATE TABLE public.gaushalas_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  lat numeric,
  lng numeric,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  is_visit_ready boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gaushalas_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active gaushalas" ON public.gaushalas_list
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage gaushalas" ON public.gaushalas_list
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add gaushala_id to orders
ALTER TABLE public.orders ADD COLUMN gaushala_id uuid REFERENCES public.gaushalas_list(id);

-- Add assigned_volunteer to orders
ALTER TABLE public.orders ADD COLUMN assigned_volunteer uuid;

-- Add donor_email to orders
ALTER TABLE public.orders ADD COLUMN donor_email text;

-- Create visit_bookings table
CREATE TABLE public.visit_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  gaushala_id uuid NOT NULL REFERENCES public.gaushalas_list(id),
  visit_date date NOT NULL,
  time_slot text NOT NULL,
  visitor_name text NOT NULL,
  visitor_phone text NOT NULL,
  visitor_email text,
  num_visitors integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  assigned_volunteer uuid,
  volunteer_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.visit_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings" ON public.visit_bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert bookings" ON public.visit_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all bookings" ON public.visit_bookings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Volunteers can view assigned bookings" ON public.visit_bookings
  FOR SELECT USING (auth.uid() = assigned_volunteer);

CREATE POLICY "Volunteers can update assigned bookings" ON public.visit_bookings
  FOR UPDATE USING (auth.uid() = assigned_volunteer);

-- Volunteers can view orders assigned to them
CREATE POLICY "Volunteers can view assigned orders" ON public.orders
  FOR SELECT USING (auth.uid() = assigned_volunteer);

CREATE POLICY "Volunteers can update assigned orders" ON public.orders
  FOR UPDATE USING (auth.uid() = assigned_volunteer);

-- Volunteers can manage evidence for assigned orders
CREATE POLICY "Volunteers can manage evidence for assigned orders" ON public.order_evidence
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_evidence.order_id
      AND orders.assigned_volunteer = auth.uid()
    )
  );

-- Add email to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
