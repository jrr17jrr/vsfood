-- VSFood — planos comerciais administráveis pelo DEV
--
-- Substitui, para fins de precificação/features exibidas na home, o que hoje
-- está hardcoded em components/marketing/pricing.tsx. Os dois planos abaixo
-- são exatamente os que já existem no código (nomes, preço, features) — não
-- há valor/recurso novo inventado aqui, só migrado para o banco.

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  complement_text text,
  cta_label text not null default 'Quero minha loja',
  price_monthly numeric(10,2),
  price_yearly numeric(10,2),
  is_featured boolean not null default false,
  is_active boolean not null default true,
  display_order int not null default 0,
  trial_days_default int not null default 7,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists plan_features (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists plan_feature_links (
  plan_id uuid not null references plans(id) on delete cascade,
  feature_id uuid not null references plan_features(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (plan_id, feature_id)
);

-- Estrutura pronta para limites numéricos por plano (item 9 do pedido).
-- `value = null` significa ilimitado. Nenhuma tela do DEV edita isso ainda,
-- nem nada no app hoje aplica esses limites — só a arquitetura fica pronta.
create table if not exists plan_limits (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans(id) on delete cascade,
  key text not null,
  value int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, key)
);

do $$
declare
  t text;
begin
  foreach t in array array['plans', 'plan_features'] loop
    execute format(
      'drop trigger if exists set_updated_at on %I; create trigger set_updated_at before update on %I for each row execute function set_updated_at();',
      t, t
    );
  end loop;
end $$;

alter table plans enable row level security;
alter table plan_features enable row level security;
alter table plan_feature_links enable row level security;
alter table plan_limits enable row level security;

-- plans: leitura pública só dos ativos (home), leitura/escrita total só admin.
create policy plans_select_active_public on plans
  for select using (is_active = true or is_admin());
create policy plans_write_admin on plans
  for insert with check (is_admin());
create policy plans_update_admin on plans
  for update using (is_admin());
create policy plans_delete_admin on plans
  for delete using (is_admin());

create policy plan_features_select_active_public on plan_features
  for select using (is_active = true or is_admin());
create policy plan_features_write_admin on plan_features
  for insert with check (is_admin());
create policy plan_features_update_admin on plan_features
  for update using (is_admin());
create policy plan_features_delete_admin on plan_features
  for delete using (is_admin());

create policy plan_feature_links_select on plan_feature_links
  for select using (
    is_admin()
    or exists (select 1 from plans p where p.id = plan_id and p.is_active = true)
  );
create policy plan_feature_links_write_admin on plan_feature_links
  for insert with check (is_admin());
create policy plan_feature_links_delete_admin on plan_feature_links
  for delete using (is_admin());

-- plan_limits: uso interno do DEV, sem leitura pública.
create policy plan_limits_select_admin on plan_limits
  for select using (is_admin());
create policy plan_limits_write_admin on plan_limits
  for insert with check (is_admin());
create policy plan_limits_update_admin on plan_limits
  for update using (is_admin());
create policy plan_limits_delete_admin on plan_limits
  for delete using (is_admin());

-- Seed: os dois planos já anunciados hoje em components/marketing/pricing.tsx.
insert into plans (code, name, description, price_monthly, price_yearly, is_featured, is_active, display_order, trial_days_default, cta_label)
values
  ('basic', 'Plano Básico', 'Comece grátis. Sem comissão por pedido, nunca.', 69.90, null, true, true, 1, 7, 'Testar 7 dias grátis'),
  ('pro', 'VSFood Pro', 'Recursos avançados para operações maiores.', null, null, false, true, 2, 7, 'Em breve')
on conflict (code) do nothing;

insert into plan_features (key, name, display_order)
values
  ('digital_menu', 'Cardápio digital', 1),
  ('unlimited_products', 'Produtos e categorias ilimitados', 2),
  ('addons', 'Adicionais e complementos', 3),
  ('unlimited_orders', 'Carrinho e pedidos ilimitados', 4),
  ('online_payment', 'Pagamento online (PIX e cartão)', 5),
  ('manual_payment', 'PIX manual, dinheiro e cartão na entrega', 6),
  ('delivery_pickup', 'Entrega e retirada', 7),
  ('delivery_fees', 'Taxas de entrega por bairro', 8),
  ('coupons', 'Cupons de desconto', 9),
  ('qr_code', 'QR Code da loja', 10),
  ('orders_panel', 'Painel completo de pedidos', 11),
  ('basic_reports', 'Relatórios básicos', 12),
  ('store_customization', 'Personalização da loja', 13),
  ('no_commission', 'Sem comissão do VSFood por pedido', 14),
  ('advanced_reports', 'Relatórios avançados', 15),
  ('loyalty', 'Programa de fidelidade', 16),
  ('cart_recovery', 'Recuperação de carrinho', 17),
  ('upsell', 'Upsell automático', 18),
  ('scheduled_orders', 'Agendamento de pedidos', 19),
  ('inventory', 'Controle de estoque', 20),
  ('auto_print', 'Impressão automática', 21),
  ('kitchen_mode', 'Modo cozinha', 22),
  ('multi_user', 'Múltiplos usuários', 23),
  ('automations', 'Automações', 24)
on conflict (key) do nothing;

insert into plan_feature_links (plan_id, feature_id)
select p.id, f.id from plans p, plan_features f
where p.code = 'basic' and f.key in (
  'digital_menu','unlimited_products','addons','unlimited_orders','online_payment',
  'manual_payment','delivery_pickup','delivery_fees','coupons','qr_code',
  'orders_panel','basic_reports','store_customization','no_commission'
)
on conflict do nothing;

insert into plan_feature_links (plan_id, feature_id)
select p.id, f.id from plans p, plan_features f
where p.code = 'pro' and f.key in (
  'advanced_reports','loyalty','cart_recovery','upsell','scheduled_orders',
  'inventory','auto_print','kitchen_mode','multi_user','automations'
)
on conflict do nothing;
