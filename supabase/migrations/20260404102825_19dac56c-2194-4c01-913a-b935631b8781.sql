
-- Add EIL columns to order_evidence
ALTER TABLE public.order_evidence
  ADD COLUMN IF NOT EXISTS file_hash text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- Set expires_at default for new rows
ALTER TABLE public.order_evidence
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days');

-- Backfill existing rows: set status to approved (legacy data) and expires_at
UPDATE public.order_evidence
  SET status = 'approved',
      expires_at = created_at + interval '30 days'
  WHERE status = 'pending' AND expires_at IS NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_evidence_file_hash ON public.order_evidence (file_hash) WHERE file_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_evidence_expires_at ON public.order_evidence (expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_evidence_status ON public.order_evidence (status);

-- Update donor-facing RLS to only show approved evidence
DROP POLICY IF EXISTS "Users can view evidence for own orders" ON public.order_evidence;
CREATE POLICY "Users can view approved evidence for own orders"
  ON public.order_evidence
  FOR SELECT
  USING (
    status = 'approved' AND
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_evidence.order_id AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Guests can view guest order evidence" ON public.order_evidence;
CREATE POLICY "Guests can view approved guest order evidence"
  ON public.order_evidence
  FOR SELECT
  TO anon
  USING (
    status = 'approved' AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_evidence.order_id
        AND orders.user_id IS NULL
        AND orders.guest_token IS NOT NULL
    )
  );
