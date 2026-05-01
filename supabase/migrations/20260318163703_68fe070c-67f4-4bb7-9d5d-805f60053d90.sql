ALTER TABLE public.orders
  ADD COLUMN is_gift boolean NOT NULL DEFAULT false,
  ADD COLUMN gift_recipient_name text,
  ADD COLUMN gift_recipient_phone text,
  ADD COLUMN gift_message text;