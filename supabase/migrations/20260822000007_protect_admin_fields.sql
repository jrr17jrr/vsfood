-- VSFood — impede que o próprio dono do restaurante altere campos que só o
-- Painel DEV deve controlar (status da assinatura, plano, período de teste).
-- RLS por si só não distingue "dono atualizando sua loja" de "dono tentando
-- burlar o teste grátis" numa única policy de UPDATE — por isso a proteção
-- fica num trigger, que sempre roda independente de como a policy permitiu.
create or replace function protect_restaurant_admin_fields()
returns trigger as $$
begin
  if not is_admin() then
    new.status = old.status;
    new.trial_started_at = old.trial_started_at;
    new.trial_expires_at = old.trial_expires_at;
    new.plan = old.plan;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists protect_restaurant_admin_fields on restaurants;
create trigger protect_restaurant_admin_fields
  before update on restaurants
  for each row execute function protect_restaurant_admin_fields();

-- Impede escalonamento de privilégio: um usuário autenticado poderia, via API
-- direta (fora do app), tentar dar UPDATE em profiles.role para 'admin'
-- (policy profiles_update_own_or_admin permite update na própria linha).
-- Este trigger reverte qualquer troca de role feita por quem não é admin.
create or replace function protect_profile_role()
returns trigger as $$
begin
  if new.role is distinct from old.role and not is_admin() then
    new.role = old.role;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists protect_profile_role on profiles;
create trigger protect_profile_role
  before update on profiles
  for each row execute function protect_profile_role();
