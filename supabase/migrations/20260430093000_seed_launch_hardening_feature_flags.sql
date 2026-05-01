INSERT INTO public.feature_flags (id, enabled, description)
VALUES
  (
    'auto_assign_volunteers',
    false,
    'Automatically assign volunteers to new orders and visits based on gaushala mapping.'
  ),
  (
    'auto_approve_basic_evidence',
    false,
    'Automatically approve validated volunteer photo uploads for paid orders on the standard happy path.'
  )
ON CONFLICT (id) DO UPDATE
SET description = EXCLUDED.description;
