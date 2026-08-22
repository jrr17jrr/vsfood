-- VSFood — Row Level Security
-- Regra geral: nenhuma tabela fica com RLS desligada. Criação de pedidos e
-- tudo que envolve pagamento/tokens do Mercado Pago NUNCA recebe policy de
-- escrita para anon/authenticated — passa sempre por Server Action com a
-- service role (que ignora RLS de forma controlada no servidor).

alter table profiles enable row level security;
alter table restaurants enable row level security;
alter table restaurant_users enable row level security;
alter table subscriptions enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_option_groups enable row level security;
alter table product_options enable row level security;
alter table customer_addresses enable row level security;
alter table delivery_zones enable row level security;
alter table opening_hours enable row level security;
alter table coupons enable row level security;
alter table coupon_usages enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_item_options enable row level security;
alter table payments enable row level security;
alter table mercadopago_connections enable row level security;
alter table reviews enable row level security;

-- profiles ---------------------------------------------------------------
create policy profiles_select_own_or_admin_or_restaurant on profiles
  for select using (
    id = auth.uid()
    or is_admin()
    or exists (
      select 1 from orders o
      where o.customer_id = profiles.id and is_restaurant_member(o.restaurant_id)
    )
  );
create policy profiles_insert_own on profiles
  for insert with check (id = auth.uid());
create policy profiles_update_own_or_admin on profiles
  for update using (id = auth.uid() or is_admin());
create policy profiles_delete_admin on profiles
  for delete using (is_admin());

-- restaurants --------------------------------------------------------------
create policy restaurants_select_public on restaurants
  for select using (true);
create policy restaurants_update_owner_or_admin on restaurants
  for update using (is_restaurant_member(id) or is_admin());
create policy restaurants_insert_admin on restaurants
  for insert with check (is_admin());
create policy restaurants_delete_admin on restaurants
  for delete using (is_admin());

-- restaurant_users -----------------------------------------------------------
create policy restaurant_users_select on restaurant_users
  for select using (user_id = auth.uid() or is_restaurant_member(restaurant_id) or is_admin());
create policy restaurant_users_write_admin on restaurant_users
  for insert with check (is_admin());
create policy restaurant_users_update_admin on restaurant_users
  for update using (is_admin());
create policy restaurant_users_delete_admin on restaurant_users
  for delete using (is_admin());

-- subscriptions --------------------------------------------------------------
create policy subscriptions_select on subscriptions
  for select using (is_restaurant_member(restaurant_id) or is_admin());
create policy subscriptions_write_admin on subscriptions
  for insert with check (is_admin());
create policy subscriptions_update_admin on subscriptions
  for update using (is_admin());
create policy subscriptions_delete_admin on subscriptions
  for delete using (is_admin());

-- categories -------------------------------------------------------------
create policy categories_select_public_active on categories
  for select using (
    active = true
    and exists (select 1 from restaurants r where r.id = restaurant_id and r.status <> 'suspended')
  );
create policy categories_select_owner_or_admin on categories
  for select using (is_restaurant_member(restaurant_id) or is_admin());
create policy categories_write_owner_or_admin on categories
  for insert with check (is_restaurant_member(restaurant_id) or is_admin());
create policy categories_update_owner_or_admin on categories
  for update using (is_restaurant_member(restaurant_id) or is_admin());
create policy categories_delete_owner_or_admin on categories
  for delete using (is_restaurant_member(restaurant_id) or is_admin());

-- products -----------------------------------------------------------------
create policy products_select_public_available on products
  for select using (
    available = true
    and exists (select 1 from restaurants r where r.id = restaurant_id and r.status <> 'suspended')
  );
create policy products_select_owner_or_admin on products
  for select using (is_restaurant_member(restaurant_id) or is_admin());
create policy products_write_owner_or_admin on products
  for insert with check (is_restaurant_member(restaurant_id) or is_admin());
create policy products_update_owner_or_admin on products
  for update using (is_restaurant_member(restaurant_id) or is_admin());
create policy products_delete_owner_or_admin on products
  for delete using (is_restaurant_member(restaurant_id) or is_admin());

-- product_option_groups ------------------------------------------------------
create policy option_groups_select_public on product_option_groups
  for select using (
    exists (
      select 1 from products p
      join restaurants r on r.id = p.restaurant_id
      where p.id = product_id and p.available = true and r.status <> 'suspended'
    )
  );
create policy option_groups_select_owner_or_admin on product_option_groups
  for select using (
    exists (select 1 from products p where p.id = product_id and (is_restaurant_member(p.restaurant_id) or is_admin()))
  );
create policy option_groups_write_owner_or_admin on product_option_groups
  for insert with check (
    exists (select 1 from products p where p.id = product_id and (is_restaurant_member(p.restaurant_id) or is_admin()))
  );
create policy option_groups_update_owner_or_admin on product_option_groups
  for update using (
    exists (select 1 from products p where p.id = product_id and (is_restaurant_member(p.restaurant_id) or is_admin()))
  );
create policy option_groups_delete_owner_or_admin on product_option_groups
  for delete using (
    exists (select 1 from products p where p.id = product_id and (is_restaurant_member(p.restaurant_id) or is_admin()))
  );

-- product_options ----------------------------------------------------------
create policy options_select_public on product_options
  for select using (
    exists (
      select 1 from product_option_groups g
      join products p on p.id = g.product_id
      join restaurants r on r.id = p.restaurant_id
      where g.id = group_id and p.available = true and r.status <> 'suspended'
    )
  );
create policy options_select_owner_or_admin on product_options
  for select using (
    exists (
      select 1 from product_option_groups g join products p on p.id = g.product_id
      where g.id = group_id and (is_restaurant_member(p.restaurant_id) or is_admin())
    )
  );
create policy options_write_owner_or_admin on product_options
  for insert with check (
    exists (
      select 1 from product_option_groups g join products p on p.id = g.product_id
      where g.id = group_id and (is_restaurant_member(p.restaurant_id) or is_admin())
    )
  );
create policy options_update_owner_or_admin on product_options
  for update using (
    exists (
      select 1 from product_option_groups g join products p on p.id = g.product_id
      where g.id = group_id and (is_restaurant_member(p.restaurant_id) or is_admin())
    )
  );
create policy options_delete_owner_or_admin on product_options
  for delete using (
    exists (
      select 1 from product_option_groups g join products p on p.id = g.product_id
      where g.id = group_id and (is_restaurant_member(p.restaurant_id) or is_admin())
    )
  );

-- customer_addresses ---------------------------------------------------------
create policy addresses_select_own on customer_addresses
  for select using (user_id = auth.uid() or is_admin());
create policy addresses_write_own on customer_addresses
  for insert with check (user_id = auth.uid());
create policy addresses_update_own on customer_addresses
  for update using (user_id = auth.uid() or is_admin());
create policy addresses_delete_own on customer_addresses
  for delete using (user_id = auth.uid() or is_admin());

-- delivery_zones -------------------------------------------------------------
create policy delivery_zones_select_public on delivery_zones
  for select using (true);
create policy delivery_zones_write_owner_or_admin on delivery_zones
  for insert with check (is_restaurant_member(restaurant_id) or is_admin());
create policy delivery_zones_update_owner_or_admin on delivery_zones
  for update using (is_restaurant_member(restaurant_id) or is_admin());
create policy delivery_zones_delete_owner_or_admin on delivery_zones
  for delete using (is_restaurant_member(restaurant_id) or is_admin());

-- opening_hours --------------------------------------------------------------
create policy opening_hours_select_public on opening_hours
  for select using (true);
create policy opening_hours_write_owner_or_admin on opening_hours
  for insert with check (is_restaurant_member(restaurant_id) or is_admin());
create policy opening_hours_update_owner_or_admin on opening_hours
  for update using (is_restaurant_member(restaurant_id) or is_admin());
create policy opening_hours_delete_owner_or_admin on opening_hours
  for delete using (is_restaurant_member(restaurant_id) or is_admin());

-- coupons ----------------------------------------------------------------
-- não é publicamente listável (evita enumerar códigos); validado no servidor.
create policy coupons_select_owner_or_admin on coupons
  for select using (is_restaurant_member(restaurant_id) or is_admin());
create policy coupons_write_owner_or_admin on coupons
  for insert with check (is_restaurant_member(restaurant_id) or is_admin());
create policy coupons_update_owner_or_admin on coupons
  for update using (is_restaurant_member(restaurant_id) or is_admin());
create policy coupons_delete_owner_or_admin on coupons
  for delete using (is_restaurant_member(restaurant_id) or is_admin());

-- coupon_usages ------------------------------------------------------------
create policy coupon_usages_select on coupon_usages
  for select using (
    user_id = auth.uid()
    or is_admin()
    or exists (select 1 from coupons c where c.id = coupon_id and is_restaurant_member(c.restaurant_id))
  );

-- orders -----------------------------------------------------------------
-- sem policy de INSERT: pedidos só são criados via Server Action com service role.
create policy orders_select on orders
  for select using (customer_id = auth.uid() or is_restaurant_member(restaurant_id) or is_admin());
create policy orders_update_owner_or_admin on orders
  for update using (is_restaurant_member(restaurant_id) or is_admin());

-- order_items / order_item_options -----------------------------------------
-- somente leitura para o client; escrita apenas via service role.
create policy order_items_select on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_id and (o.customer_id = auth.uid() or is_restaurant_member(o.restaurant_id) or is_admin())
    )
  );
create policy order_item_options_select on order_item_options
  for select using (
    exists (
      select 1 from order_items oi join orders o on o.id = oi.order_id
      where oi.id = order_item_id and (o.customer_id = auth.uid() or is_restaurant_member(o.restaurant_id) or is_admin())
    )
  );

-- payments -----------------------------------------------------------------
-- somente leitura para o client; toda escrita via service role (create + webhook).
create policy payments_select on payments
  for select using (
    is_restaurant_member(restaurant_id)
    or is_admin()
    or exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
  );

-- mercadopago_connections ----------------------------------------------------
-- nenhuma policy: acesso exclusivo via service role no servidor.

-- reviews ------------------------------------------------------------------
create policy reviews_select_public on reviews
  for select using (true);
create policy reviews_insert_own on reviews
  for insert with check (customer_id = auth.uid());
create policy reviews_delete_admin on reviews
  for delete using (is_admin());
