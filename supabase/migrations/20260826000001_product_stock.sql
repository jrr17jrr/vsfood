-- VSFood — estoque opcional por produto.
--
-- unlimited_stock = true (padrão): comportamento atual, sem limite de
-- quantidade — nenhuma mudança pra quem não usa a funcionalidade.
-- unlimited_stock = false: stock_quantity controla a disponibilidade;
-- quantidade 0 = produto esgotado (mas continua "available" — não precisa
-- ser apagado/desativado pra sair de venda).

alter table products
  add column if not exists unlimited_stock boolean not null default true,
  add column if not exists stock_quantity integer not null default 0;

alter table products drop constraint if exists products_stock_quantity_non_negative;
alter table products
  add constraint products_stock_quantity_non_negative check (stock_quantity >= 0);

-- Decrementa o estoque de vários produtos de uma vez, tudo em uma única
-- transação (o corpo da function é atômico): se QUALQUER produto de estoque
-- limitado não tiver quantidade suficiente, a function inteira falha e
-- nenhum decremento é aplicado — nunca deixa estoque parcialmente
-- decrementado. Produtos com unlimited_stock=true são ignorados (a
-- condição `unlimited_stock = false` no UPDATE simplesmente não bate neles).
--
-- Cada UPDATE já é a própria checagem atômica de concorrência: a cláusula
-- `stock_quantity >= v_quantity` no WHERE é avaliada e aplicada pelo Postgres
-- como uma única operação sob lock de linha — dois pedidos concorrentes pro
-- mesmo produto serializam nessa linha (um espera o outro terminar o UPDATE
-- antes de reavaliar sua própria condição), então nunca dá pra dois pedidos
-- "lerem" o mesmo estoque disponível e ambos decrementarem além da conta.
-- É por isso que isso NUNCA pode ser um `stock = stock - quantity` sem
-- condição no WHERE.
create or replace function decrement_products_stock(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  v_product_id uuid;
  v_quantity int;
  v_updated_id uuid;
begin
  for item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (item->>'product_id')::uuid;
    v_quantity := (item->>'quantity')::int;

    if v_quantity <= 0 then
      continue;
    end if;

    update products
    set stock_quantity = stock_quantity - v_quantity
    where id = v_product_id
      and unlimited_stock = false
      and stock_quantity >= v_quantity
    returning id into v_updated_id;

    if v_updated_id is null then
      -- Só é erro se o produto é de estoque limitado e o UPDATE não bateu
      -- por falta de quantidade — se for unlimited_stock=true, o UPDATE
      -- nunca bate no WHERE mesmo (e isso é o comportamento esperado, não
      -- uma falha).
      if exists (select 1 from products where id = v_product_id and unlimited_stock = false) then
        raise exception 'Estoque insuficiente para o produto %', v_product_id
          using errcode = 'P0001';
      end if;
    end if;
  end loop;
end;
$$;

-- Restaura estoque (ex: pedido cancelado/recusado) — soma sempre é segura,
-- não precisa de condição de concorrência como o decremento. Também ignora
-- produtos com unlimited_stock=true.
create or replace function restore_products_stock(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  v_product_id uuid;
  v_quantity int;
begin
  for item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (item->>'product_id')::uuid;
    v_quantity := (item->>'quantity')::int;

    if v_quantity <= 0 then
      continue;
    end if;

    update products
    set stock_quantity = stock_quantity + v_quantity
    where id = v_product_id
      and unlimited_stock = false;
  end loop;
end;
$$;

-- Só o service role (usado por createOrderAction e pelo cancelamento no
-- painel, sempre depois de validação server-side própria) pode chamar --
-- nunca diretamente por uma sessão de cliente autenticada, que pulariam a
-- validação de preço/estoque feita antes de chegar aqui.
revoke all on function decrement_products_stock(jsonb) from public;
revoke all on function restore_products_stock(jsonb) from public;
grant execute on function decrement_products_stock(jsonb) to service_role;
grant execute on function restore_products_stock(jsonb) to service_role;
