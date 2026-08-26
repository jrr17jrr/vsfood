-- VSFood — aceite automático de pedidos + arquitetura de impressão.
--
-- Prepara o modelo de dados pro futuro VSFood Print (app local que vai
-- buscar pedidos pendentes e imprimir de verdade) sem implementar nenhum
-- programa/serviço agora. print_status vive em `orders` (é o estado da
-- impressão DESSE pedido, igual accepted_at/ready_at já fazem pro status);
-- as preferências de impressão vivem em `restaurants`.

do $$ begin
  create type print_status as enum ('pending', 'processing', 'printed', 'failed');
exception when duplicate_object then null; end $$;

alter table restaurants
  add column if not exists auto_accept_orders boolean not null default false,
  add column if not exists auto_print_enabled boolean not null default false,
  add column if not exists print_format text not null default 'a4',
  add column if not exists print_copies int not null default 1,
  add column if not exists print_show_prices boolean not null default true,
  add column if not exists print_show_address boolean not null default true,
  add column if not exists print_show_phone boolean not null default true,
  add column if not exists print_show_notes boolean not null default true;

do $$ begin
  alter table restaurants
    add constraint restaurants_print_format_check check (print_format in ('a4', '80mm', '58mm'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table restaurants
    add constraint restaurants_print_copies_range check (print_copies between 1 and 5);
exception when duplicate_object then null; end $$;

-- orders: estado de impressão do pedido. Nunca marcado como 'printed' pela
-- criação do pedido nem pelo botão de impressão manual (window.print(), sem
-- confirmação real) — só um dispositivo de verdade (VSFood Print, próxima
-- etapa) confirma sucesso via ação server-side.
alter table orders
  add column if not exists print_status print_status not null default 'pending',
  add column if not exists print_attempts int not null default 0,
  add column if not exists last_print_attempt_at timestamptz,
  add column if not exists printed_at timestamptz,
  add column if not exists print_error text;

create index if not exists orders_print_queue_idx on orders (restaurant_id, print_status, created_at);

-- Claim atômico do próximo pedido pendente de impressão — `for update skip
-- locked` garante que duas chamadas concorrentes (dois dispositivos, ou
-- retries) nunca peguem o mesmo pedido: quem perde a corrida simplesmente
-- pula a linha travada e vê o próximo pedido (ou nenhum), em vez de esperar
-- e reprocessar o mesmo. Mesmo padrão de confiança de
-- decrement_products_stock (20260826000001_product_stock.sql): só
-- service_role executa, sempre chamada a partir de uma Server Action que já
-- validou a sessão e derivou restaurant_id do membership autenticado — nunca
-- de um id solto do client.
create or replace function claim_next_print_order(p_restaurant_id uuid)
returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  result orders;
begin
  update orders o
  set print_status = 'processing',
      print_attempts = print_attempts + 1,
      last_print_attempt_at = now()
  where o.id = (
    select id from orders
    where restaurant_id = p_restaurant_id
      and print_status = 'pending'
      and status not in ('cancelled', 'rejected')
    order by created_at
    limit 1
    for update skip locked
  )
  returning * into result;

  return result;
end;
$$;

revoke all on function claim_next_print_order(uuid) from public;
grant execute on function claim_next_print_order(uuid) to service_role;
