alter table public.orders
add column if not exists expected_completion_at timestamptz;
