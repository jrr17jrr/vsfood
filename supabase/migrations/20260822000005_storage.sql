-- VSFood — Storage
-- Bucket único "restaurants", organizado por pasta:
--   restaurants/{restaurant_id}/logo
--   restaurants/{restaurant_id}/banner
--   restaurants/{restaurant_id}/products/{product_id}

insert into storage.buckets (id, name, public)
values ('restaurants', 'restaurants', true)
on conflict (id) do nothing;

-- leitura pública (logos/banners/fotos de produto aparecem na loja sem login)
create policy restaurants_bucket_public_read on storage.objects
  for select using (bucket_id = 'restaurants');

-- escrita restrita ao dono do restaurante (1º segmento do path = restaurant_id) ou admin
create policy restaurants_bucket_owner_insert on storage.objects
  for insert with check (
    bucket_id = 'restaurants'
    and (is_restaurant_member((storage.foldername(name))[1]::uuid) or is_admin())
  );
create policy restaurants_bucket_owner_update on storage.objects
  for update using (
    bucket_id = 'restaurants'
    and (is_restaurant_member((storage.foldername(name))[1]::uuid) or is_admin())
  );
create policy restaurants_bucket_owner_delete on storage.objects
  for delete using (
    bucket_id = 'restaurants'
    and (is_restaurant_member((storage.foldername(name))[1]::uuid) or is_admin())
  );
