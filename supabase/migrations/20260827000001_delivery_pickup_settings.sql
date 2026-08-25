-- VSFood — configurações de entrega/retirada por restaurante + campos
-- opcionais por região de entrega.
--
-- Defaults preservam o comportamento atual: delivery_enabled/pickup_enabled
-- começam true (hoje o checkout já mostra as duas opções sempre), os campos
-- novos de retirada/frete grátis começam null (sem regra extra até o dono
-- configurar). Nenhuma coluna existente é alterada.

alter table restaurants
  add column if not exists delivery_enabled boolean not null default true,
  add column if not exists pickup_enabled boolean not null default true,
  add column if not exists free_shipping_threshold numeric(10,2),
  add column if not exists pickup_min_order_value numeric(10,2),
  add column if not exists pickup_estimated_time_minutes int;

alter table restaurants drop constraint if exists restaurants_free_shipping_threshold_non_negative;
alter table restaurants
  add constraint restaurants_free_shipping_threshold_non_negative check (free_shipping_threshold is null or free_shipping_threshold >= 0);

alter table restaurants drop constraint if exists restaurants_pickup_min_order_value_non_negative;
alter table restaurants
  add constraint restaurants_pickup_min_order_value_non_negative check (pickup_min_order_value is null or pickup_min_order_value >= 0);

alter table restaurants drop constraint if exists restaurants_pickup_estimated_time_minutes_non_negative;
alter table restaurants
  add constraint restaurants_pickup_estimated_time_minutes_non_negative check (pickup_estimated_time_minutes is null or pickup_estimated_time_minutes >= 0);

-- Campos opcionais por região: pedido mínimo e tempo estimado específicos
-- (null = usa a regra geral do restaurante), mais ordem de exibição.
alter table delivery_zones
  add column if not exists min_order_value numeric(10,2),
  add column if not exists estimated_time_minutes int,
  add column if not exists "order" int not null default 0;

alter table delivery_zones drop constraint if exists delivery_zones_min_order_value_non_negative;
alter table delivery_zones
  add constraint delivery_zones_min_order_value_non_negative check (min_order_value is null or min_order_value >= 0);

alter table delivery_zones drop constraint if exists delivery_zones_estimated_time_minutes_non_negative;
alter table delivery_zones
  add constraint delivery_zones_estimated_time_minutes_non_negative check (estimated_time_minutes is null or estimated_time_minutes >= 0);

create index if not exists delivery_zones_restaurant_order_idx on delivery_zones (restaurant_id, "order");
