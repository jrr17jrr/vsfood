-- VSFood — fecha o autocadastro público de restaurant_owner
--
-- handle_new_auth_user() confiava em raw_user_meta_data->>'role', que é o
-- `options.data` do supabase.auth.signUp — controlado pelo client público.
-- Qualquer chamada direta à REST API do Supabase Auth (fora do Next.js)
-- conseguia se auto-promover a restaurant_owner. app_metadata só pode ser
-- setado via Admin API (service role), nunca pelo client, então passa a ser
-- a única fonte confiável de role no momento do cadastro.
create or replace function handle_new_auth_user()
returns trigger as $$
begin
  insert into profiles (id, role, name, whatsapp, email, avatar_url, provider)
  values (
    new.id,
    coalesce((new.raw_app_meta_data->>'role')::user_role, 'customer'),
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'whatsapp',
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    coalesce(new.raw_app_meta_data->>'provider', 'email')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- protect_profile_role bloqueava até updates feitos pelo service role (usado
-- pelo admin para "vincular conta existente como dono"), porque auth.uid() é
-- nulo nessa conexão. Service role já ignora RLS por design no projeto
-- (lib/supabase/server.ts) — aqui só reconhecemos essa mesma confiança no
-- trigger, mantendo a proteção contra o próprio usuário autenticado.
create or replace function protect_profile_role()
returns trigger as $$
begin
  if new.role is distinct from old.role and not is_admin() and auth.role() <> 'service_role' then
    new.role = old.role;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;
