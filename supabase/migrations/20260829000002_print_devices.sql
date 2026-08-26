-- VSFood Print — dispositivos de impressão pareados e códigos de pareamento.
--
-- O app desktop (VSFood Print) nunca autentica como o dono da loja (sem
-- email/senha do painel, sem service role embutido). Em vez disso:
--   1. o dono gera um código de pareamento curto no painel (print_pairing_codes);
--   2. o app troca esse código por um token de dispositivo de longa duração
--      (print_devices), que só ele guarda;
--   3. toda chamada seguinte do app usa esse token — nunca um restaurant_id
--      solto — e o servidor deriva o restaurant_id a partir do token.
--
-- Só o hash dos segredos fica no banco (nunca o código/token em texto puro),
-- mesmo padrão de "nunca confiar em dado vindo do client" já usado em
-- claim_next_print_order (20260829000001_order_print_and_auto_accept.sql).

create table if not exists print_devices (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null default 'Computador',
  token_hash text not null unique,
  platform text,
  app_version text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  active boolean not null default true
);

create index if not exists print_devices_restaurant_idx on print_devices (restaurant_id) where active;

create table if not exists print_pairing_codes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Busca do código em /api/print/pair é sempre por code_hash (sha-256
-- determinístico, não bcrypt) — dá pra indexar e fazer lookup direto em vez
-- de varrer todas as linhas comparando uma a uma.
create unique index if not exists print_pairing_codes_hash_idx on print_pairing_codes (code_hash);
create index if not exists print_pairing_codes_cleanup_idx on print_pairing_codes (expires_at);

alter table print_devices enable row level security;
alter table print_pairing_codes enable row level security;

-- Dono/admin vê e revoga dispositivos da própria loja pelo painel (sessão
-- normal, RLS por membership). O app desktop NUNCA usa essas policies —
-- ele fala só com as rotas /api/print/*, que autenticam por token e usam
-- o service role internamente (mesmo modelo de claim_next_print_order).
create policy print_devices_select_owner_or_admin on print_devices
  for select using (is_restaurant_member(restaurant_id) or is_admin());
create policy print_devices_update_owner_or_admin on print_devices
  for update using (is_restaurant_member(restaurant_id) or is_admin());

create policy print_pairing_codes_select_owner_or_admin on print_pairing_codes
  for select using (is_restaurant_member(restaurant_id) or is_admin());
create policy print_pairing_codes_insert_owner_or_admin on print_pairing_codes
  for insert with check (is_restaurant_member(restaurant_id) or is_admin());

-- Timeout/recovery: pedido travado em "processing" (app fechou/crashou entre
-- o claim e a confirmação) não pode ficar preso pra sempre. Chamada
-- periódica (cron ou no próprio /api/print/next-job) recupera qualquer
-- pedido "processing" há mais de p_stale_minutes voltando pra "pending" —
-- reimprimir uma via a mais é bem menos ruim que nunca imprimir.
create or replace function recover_stale_print_orders(p_stale_minutes int default 5)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  affected int;
begin
  update orders
  set print_status = 'pending'
  where print_status = 'processing'
    and last_print_attempt_at < now() - (p_stale_minutes || ' minutes')::interval;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function recover_stale_print_orders(int) from public;
grant execute on function recover_stale_print_orders(int) to service_role;
