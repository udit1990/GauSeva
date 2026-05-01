
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  certificate_type text NOT NULL DEFAULT 'general',
  certificate_number text NOT NULL,
  donor_name text NOT NULL,
  donor_email text,
  donor_pan text,
  amount numeric NOT NULL,
  issued_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'issued',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates" ON public.certificates
  FOR SELECT TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own certificates" ON public.certificates
  FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all certificates" ON public.certificates
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role));
