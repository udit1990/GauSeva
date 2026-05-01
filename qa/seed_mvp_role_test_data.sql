do $$
begin
  insert into public.gaushalas_list (
    id,
    name,
    city,
    state,
    description,
    is_active,
    is_visit_ready,
    sort_order
  )
  values (
    '11111111-1111-1111-1111-111111111111',
    'Dhyan Test Gaushala',
    'New Delhi',
    'Delhi',
    'QA gaushala for MVP role testing',
    true,
    true,
    1
  )
  on conflict (id) do update
  set
    name = excluded.name,
    city = excluded.city,
    state = excluded.state,
    description = excluded.description,
    is_active = true,
    is_visit_ready = true,
    sort_order = 1,
    updated_at = now();

  update public.profiles
  set
    gaushala_id = '11111111-1111-1111-1111-111111111111',
    phone = coalesce(phone, '+919999999999')
  where id = '53c73910-f6e2-4851-ace6-023146cb9ff6';

  update public.profiles
  set phone = coalesce(phone, '+919888888888')
  where id = 'd4cfa657-b894-4af7-bbfa-eb6a85d83c98';

  insert into public.orders (
    id,
    donor_name,
    donor_phone,
    donor_email,
    total_amount,
    status,
    gaushala_id,
    assigned_volunteer,
    user_id,
    animal_type,
    persona,
    payment_method
  )
  values (
    '22222222-2222-2222-2222-222222222222',
    'Test Donor',
    '+919777777777',
    'user@test.com',
    501,
    'paid',
    '11111111-1111-1111-1111-111111111111',
    '53c73910-f6e2-4851-ace6-023146cb9ff6',
    '0f245562-686a-4e9e-b5c8-031b1fcedf0b',
    'cow',
    'gau_seva',
    'test'
  )
  on conflict (id) do update
  set
    donor_name = excluded.donor_name,
    donor_phone = excluded.donor_phone,
    donor_email = excluded.donor_email,
    total_amount = excluded.total_amount,
    status = 'paid',
    gaushala_id = excluded.gaushala_id,
    assigned_volunteer = excluded.assigned_volunteer,
    user_id = excluded.user_id,
    animal_type = excluded.animal_type,
    persona = excluded.persona,
    payment_method = excluded.payment_method,
    updated_at = now();

  insert into public.order_items (
    id,
    order_id,
    sku_name,
    quantity,
    unit_price,
    total_price,
    is_custom_amount
  )
  values (
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'Green Fodder Bundle',
    1,
    501,
    501,
    false
  )
  on conflict (id) do update
  set
    sku_name = excluded.sku_name,
    quantity = excluded.quantity,
    unit_price = excluded.unit_price,
    total_price = excluded.total_price,
    is_custom_amount = false;
end
$$;
