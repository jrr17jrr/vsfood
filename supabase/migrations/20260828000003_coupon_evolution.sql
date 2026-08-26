-- VSFood — evolução de cupons: frete grátis, desconto máximo, limite por
-- cliente, restrição a entrega/retirada, primeira compra, e restrição por
-- categoria/produto específico.
--
-- O valor de enum 'free_shipping' foi adicionado em migration própria
-- (20260828000001_coupon_type_free_shipping.sql) por exigência do Postgres
-- (não dá pra usar um valor de enum recém-criado na mesma transação).

alter table coupons
  add column if not exists max_discount_value numeric(10,2),
  add column if not exists usage_limit_per_customer int,
  add column if not exists applies_to_delivery boolean not null default true,
  add column if not exists applies_to_pickup boolean not null default true,
  add column if not exists first_purchase_only boolean not null default false,
  add column if not exists applies_to_all_products boolean not null default true;

do $$ begin
  alter table coupons
    add constraint coupons_max_discount_value_non_negative
    check (max_discount_value is null or max_discount_value >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table coupons
    add constraint coupons_usage_limit_per_customer_positive
    check (usage_limit_per_customer is null or usage_limit_per_customer > 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table coupons
    add constraint coupons_applies_to_delivery_or_pickup
    check (applies_to_delivery or applies_to_pickup);
exception when duplicate_object then null; end $$;

-- Restrição a categorias específicas (ignorado quando applies_to_all_products = true).
create table if not exists coupon_categories (
  coupon_id uuid not null references coupons(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (coupon_id, category_id)
);

-- Restrição a produtos específicos (ignorado quando applies_to_all_products = true).
create table if not exists coupon_products (
  coupon_id uuid not null references coupons(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  primary key (coupon_id, product_id)
);

alter table coupon_categories enable row level security;
alter table coupon_products enable row level security;

-- Mesma política de coupons: só dono do restaurante do cupom ou admin (nada
-- de leitura pública — evita enumerar regras de desconto).
create policy coupon_categories_select_owner_or_admin on coupon_categories
  for select using (exists (select 1 from coupons c where c.id = coupon_id and (is_restaurant_member(c.restaurant_id) or is_admin())));
create policy coupon_categories_write_owner_or_admin on coupon_categories
  for insert with check (exists (select 1 from coupons c where c.id = coupon_id and (is_restaurant_member(c.restaurant_id) or is_admin())));
create policy coupon_categories_delete_owner_or_admin on coupon_categories
  for delete using (exists (select 1 from coupons c where c.id = coupon_id and (is_restaurant_member(c.restaurant_id) or is_admin())));

create policy coupon_products_select_owner_or_admin on coupon_products
  for select using (exists (select 1 from coupons c where c.id = coupon_id and (is_restaurant_member(c.restaurant_id) or is_admin())));
create policy coupon_products_write_owner_or_admin on coupon_products
  for insert with check (exists (select 1 from coupons c where c.id = coupon_id and (is_restaurant_member(c.restaurant_id) or is_admin())));
create policy coupon_products_delete_owner_or_admin on coupon_products
  for delete using (exists (select 1 from coupons c where c.id = coupon_id and (is_restaurant_member(c.restaurant_id) or is_admin())));
