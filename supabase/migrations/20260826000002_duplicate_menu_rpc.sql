-- VSFood — duplicar produto / duplicar categoria inteira.
--
-- Cada duplicação roda inteira dentro do corpo de uma única function
-- plpgsql — isso é uma transação implícita: se qualquer INSERT no meio do
-- processo falhar, a function inteira dá rollback sozinha (nenhuma cópia
-- parcial fica no banco). É por isso que isso é uma function no banco em
-- vez de várias chamadas sequenciais do client (que não teriam como
-- desfazer o que já tivesse sido inserido se uma etapa no meio falhasse).
--
-- security definer + checagem manual de restaurant_id (em vez de confiar
-- só em RLS): a policy pública de leitura de products permite ver produtos
-- `available = true` de QUALQUER restaurante (é o que sustenta a loja
-- pública), então só RLS não bastaria pra impedir um dono de duplicar
-- produto de outro restaurante — por isso a function valida
-- `p_restaurant_id` explicitamente (esse parâmetro vem de
-- requireRestaurantMembership() no server action, nunca do client) antes
-- de fazer qualquer cópia.

create or replace function duplicate_product_into(
  p_source_product_id uuid,
  p_target_category_id uuid,
  p_new_name text,
  p_restaurant_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source products%rowtype;
  v_new_id uuid;
  v_next_order int;
  v_group product_option_groups%rowtype;
  v_new_group_id uuid;
begin
  select * into v_source from products where id = p_source_product_id;
  if v_source.id is null then
    raise exception 'Produto de origem não encontrado.';
  end if;
  if v_source.restaurant_id <> p_restaurant_id then
    raise exception 'Produto não pertence a esta loja.';
  end if;

  select coalesce(max("order") + 1, 0) into v_next_order from products where restaurant_id = p_restaurant_id;

  insert into products (
    restaurant_id, category_id, name, description, price, promo_price, image_url,
    available, featured, unlimited_stock, stock_quantity, "order"
  ) values (
    p_restaurant_id, p_target_category_id, p_new_name, v_source.description, v_source.price, v_source.promo_price,
    v_source.image_url, v_source.available, v_source.featured, v_source.unlimited_stock, v_source.stock_quantity, v_next_order
  ) returning id into v_new_id;

  for v_group in select * from product_option_groups where product_id = p_source_product_id order by "order"
  loop
    insert into product_option_groups (
      product_id, name, required, min_select, max_select, pricing_mode, free_quantity, fixed_price, "order"
    ) values (
      v_new_id, v_group.name, v_group.required, v_group.min_select, v_group.max_select, v_group.pricing_mode,
      v_group.free_quantity, v_group.fixed_price, v_group."order"
    ) returning id into v_new_group_id;

    insert into product_options (group_id, name, price, available, "order")
    select v_new_group_id, name, price, available, "order"
    from product_options
    where group_id = v_group.id
    order by "order";
  end loop;

  return v_new_id;
end;
$$;

create or replace function duplicate_product(p_product_id uuid, p_restaurant_id uuid) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source products%rowtype;
  v_new_id uuid;
begin
  select * into v_source from products where id = p_product_id;
  if v_source.id is null then
    raise exception 'Produto não encontrado.';
  end if;
  if v_source.restaurant_id <> p_restaurant_id then
    raise exception 'Produto não pertence a esta loja.';
  end if;

  v_new_id := duplicate_product_into(p_product_id, v_source.category_id, v_source.name || ' (Cópia)', p_restaurant_id);
  return v_new_id;
end;
$$;

create or replace function duplicate_category(p_category_id uuid, p_restaurant_id uuid) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source categories%rowtype;
  v_new_category_id uuid;
  v_next_order int;
  v_product products%rowtype;
begin
  select * into v_source from categories where id = p_category_id;
  if v_source.id is null then
    raise exception 'Categoria não encontrada.';
  end if;
  if v_source.restaurant_id <> p_restaurant_id then
    raise exception 'Categoria não pertence a esta loja.';
  end if;

  select coalesce(max("order") + 1, 0) into v_next_order from categories where restaurant_id = p_restaurant_id;

  insert into categories (restaurant_id, name, "order", active)
  values (p_restaurant_id, v_source.name || ' (Cópia)', v_next_order, v_source.active)
  returning id into v_new_category_id;

  for v_product in select * from products where category_id = p_category_id order by "order"
  loop
    perform duplicate_product_into(v_product.id, v_new_category_id, v_product.name, p_restaurant_id);
  end loop;

  return v_new_category_id;
end;
$$;

revoke all on function duplicate_product_into(uuid, uuid, text, uuid) from public;
revoke all on function duplicate_product(uuid, uuid) from public;
revoke all on function duplicate_category(uuid, uuid) from public;
grant execute on function duplicate_product(uuid, uuid) to authenticated;
grant execute on function duplicate_category(uuid, uuid) to authenticated;
