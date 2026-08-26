-- VSFood — evolução de entrega: localização da loja (mapa), raio de entrega,
-- taxa por km, faixas de distância, e bairros completos (UF + cidade).
--
-- Reaproveita restaurants/delivery_zones já existentes — só adiciona colunas.
-- Zonas (delivery_zones) já cadastradas continuam válidas: state/city ficam
-- nulos nelas e o match cai pra "bairro apenas" (ver lib/orders/delivery-pricing.ts),
-- sem exigir backfill nem quebrar dado atual.

alter table restaurants
  add column if not exists latitude numeric(10,7),
  add column if not exists longitude numeric(10,7),
  add column if not exists delivery_radius_km numeric(5,2),
  add column if not exists delivery_charge_mode text not null default 'neighborhood',
  add column if not exists delivery_base_fee numeric(10,2),
  add column if not exists delivery_fee_per_km numeric(10,2);

do $$ begin
  alter table restaurants
    add constraint restaurants_delivery_charge_mode_check
    check (delivery_charge_mode in ('neighborhood', 'fixed', 'per_km', 'tiered'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table restaurants
    add constraint restaurants_delivery_radius_km_positive
    check (delivery_radius_km is null or delivery_radius_km > 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table restaurants
    add constraint restaurants_delivery_base_fee_non_negative
    check (delivery_base_fee is null or delivery_base_fee >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table restaurants
    add constraint restaurants_delivery_fee_per_km_non_negative
    check (delivery_fee_per_km is null or delivery_fee_per_km >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table restaurants
    add constraint restaurants_latitude_range
    check (latitude is null or (latitude >= -90 and latitude <= 90));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table restaurants
    add constraint restaurants_longitude_range
    check (longitude is null or (longitude >= -180 and longitude <= 180));
exception when duplicate_object then null; end $$;

-- delivery_zones: UF + cidade além do bairro já existente (comparação segura
-- por UF+cidade+bairro em vez de só bairro).
alter table delivery_zones
  add column if not exists state text,
  add column if not exists city text;

-- customer_addresses: cache de geocodificação (evita regeocodificar o mesmo
-- endereço a cada novo pedido do cliente).
alter table customer_addresses
  add column if not exists latitude numeric(10,7),
  add column if not exists longitude numeric(10,7);

-- Faixas de distância ("até X km custa R$Y"), usadas quando
-- restaurants.delivery_charge_mode = 'tiered'.
create table if not exists delivery_distance_tiers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  max_distance_km numeric(5,2) not null check (max_distance_km > 0),
  fee numeric(10,2) not null check (fee >= 0),
  "order" int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists delivery_distance_tiers_restaurant_order_idx on delivery_distance_tiers (restaurant_id, "order");

drop trigger if exists set_updated_at on delivery_distance_tiers;
create trigger set_updated_at before update on delivery_distance_tiers for each row execute function set_updated_at();

alter table delivery_distance_tiers enable row level security;

create policy delivery_distance_tiers_select_public on delivery_distance_tiers
  for select using (true);
create policy delivery_distance_tiers_write_owner_or_admin on delivery_distance_tiers
  for insert with check (is_restaurant_member(restaurant_id) or is_admin());
create policy delivery_distance_tiers_update_owner_or_admin on delivery_distance_tiers
  for update using (is_restaurant_member(restaurant_id) or is_admin());
create policy delivery_distance_tiers_delete_owner_or_admin on delivery_distance_tiers
  for delete using (is_restaurant_member(restaurant_id) or is_admin());
