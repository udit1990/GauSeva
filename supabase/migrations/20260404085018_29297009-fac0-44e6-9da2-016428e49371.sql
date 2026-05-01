
-- Migration 1: profiles extension
ALTER TABLE profiles ADD COLUMN persona_preference TEXT DEFAULT NULL;

-- Migration 2: seva_categories extension
ALTER TABLE seva_categories
  ADD COLUMN animal_type TEXT NOT NULL DEFAULT 'cow',
  ADD COLUMN persona_visibility TEXT NOT NULL DEFAULT 'both',
  ADD COLUMN title_hi TEXT DEFAULT NULL,
  ADD COLUMN subtitle_hi TEXT DEFAULT NULL;

-- Migration 3: skus extension
ALTER TABLE skus
  ADD COLUMN animal_type TEXT NOT NULL DEFAULT 'cow',
  ADD COLUMN persona_visibility TEXT NOT NULL DEFAULT 'both',
  ADD COLUMN title_hi TEXT DEFAULT NULL,
  ADD COLUMN description_hi TEXT DEFAULT NULL;

-- Migration 4: orders extension
ALTER TABLE orders
  ADD COLUMN animal_type TEXT DEFAULT 'cow',
  ADD COLUMN persona TEXT DEFAULT NULL;

-- Migration 5: animal_zones table
CREATE TABLE public.animal_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  animal_type TEXT NOT NULL,
  location TEXT,
  active_tasks INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.animal_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active zones" ON public.animal_zones
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage zones" ON public.animal_zones
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Migration 6: evidence_requirements on categories
ALTER TABLE seva_categories ADD COLUMN evidence_requirements JSONB DEFAULT NULL;

-- Migration 7: Backfill existing data
UPDATE orders SET donor_phone = 'anonymous' WHERE donor_phone = '0000000000';

-- P0 Security Fix: tighten order_evidence guest RLS
DROP POLICY IF EXISTS "Guests can view guest order evidence" ON order_evidence;
CREATE POLICY "Guests can view guest order evidence" ON order_evidence
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_evidence.order_id
      AND orders.user_id IS NULL
      AND orders.guest_token IS NOT NULL
  ));
