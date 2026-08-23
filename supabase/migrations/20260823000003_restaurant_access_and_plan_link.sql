-- VSFood — tipo de acesso (teste/assinante/demo) e vínculo ao plano estruturado
--
-- "Demo" não é um valor de restaurant_status: quando marcado, forçamos
-- status='active' para reaproveitar a RLS/visibilidade pública já existente
-- (restaurants_select_public, categories/products "status <> 'suspended'")
-- sem tocar em nenhuma policy — a loja demo simplesmente nunca fica
-- suspensa/expirada aos olhos do resto do sistema.
do $$ begin
  create type access_type as enum ('trial', 'subscriber', 'demo');
exception when duplicate_object then null; end $$;

alter table restaurants
  add column if not exists plan_id uuid references plans(id),
  add column if not exists access_type access_type not null default 'trial',
  add column if not exists is_demo boolean not null default false;

-- Backfill: nenhuma loja existente muda de comportamento, só ganha os
-- metadados novos coerentes com o que já tinha em `status`/`plan`.
update restaurants
set access_type = case when status = 'trial' then 'trial'::access_type else 'subscriber'::access_type end
where access_type = 'trial' and status <> 'trial';

update restaurants r
set plan_id = p.id
from plans p
where r.plan_id is null and p.code = 'basic';

-- Estende a proteção que já existia para status/plano/teste
-- (20260822000007_protect_admin_fields.sql) para as 3 colunas novas: sem
-- isso, o dono da própria loja poderia setá-las via a mesma policy
-- restaurants_update_owner_or_admin que já permite ele atualizar sua loja.
create or replace function protect_restaurant_admin_fields()
returns trigger as $$
begin
  if not is_admin() then
    new.status = old.status;
    new.trial_started_at = old.trial_started_at;
    new.trial_expires_at = old.trial_expires_at;
    new.plan = old.plan;
    new.plan_id = old.plan_id;
    new.access_type = old.access_type;
    new.is_demo = old.is_demo;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;
