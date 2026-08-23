-- VSFood — configuração global do teste grátis
--
-- Teste grátis continua sendo um access_type (restaurants.access_type), nunca
-- um plano. Esta tabela é só a configuração default usada ao criar uma loja
-- com acesso "trial": dias padrão, plano padrão e o texto exibido na home.
-- Tabela singleton (uma linha só, seedada abaixo); não há mecanismo de banco
-- forçando isso — a app sempre lê/edita a primeira linha por created_at.
create table if not exists trial_settings (
  id uuid primary key default gen_random_uuid(),
  is_active boolean not null default true,
  default_days int not null default 7,
  default_plan_id uuid references plans(id),
  headline_template text not null default 'Teste grátis por {days} dias',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on trial_settings;
create trigger set_updated_at before update on trial_settings
  for each row execute function set_updated_at();

alter table trial_settings enable row level security;

-- lido pela home pública (badge/CTA de teste grátis) e pelo DEV.
create policy trial_settings_select_public on trial_settings
  for select using (true);
create policy trial_settings_write_admin on trial_settings
  for insert with check (is_admin());
create policy trial_settings_update_admin on trial_settings
  for update using (is_admin());
create policy trial_settings_delete_admin on trial_settings
  for delete using (is_admin());

insert into trial_settings (is_active, default_days, default_plan_id, headline_template)
select true, 7, p.id, 'Teste grátis por {days} dias'
from plans p
where p.code = 'basic'
and not exists (select 1 from trial_settings);
