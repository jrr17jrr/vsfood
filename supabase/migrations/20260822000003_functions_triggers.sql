-- VSFood — funções e triggers

-- updated_at automático
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','restaurants','subscriptions','categories','products',
    'product_option_groups','product_options','customer_addresses',
    'delivery_zones','coupons','orders','payments','mercadopago_connections'
  ] loop
    execute format(
      'drop trigger if exists set_updated_at on %I; create trigger set_updated_at before update on %I for each row execute function set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- cria profile automaticamente quando um usuário se cadastra no Supabase Auth
-- (cadastro tradicional por e-mail/senha OU primeiro login via OAuth, ex: Google).
-- Para OAuth, o Supabase já cria a linha em auth.users com os dados do provedor
-- em raw_user_meta_data/raw_app_meta_data antes deste trigger disparar — por
-- isso não é preciso nenhuma chamada extra do frontend para "criar o profile".
create or replace function handle_new_auth_user()
returns trigger as $$
begin
  insert into profiles (id, role, name, whatsapp, email, avatar_url, provider)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer'),
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- numeração amigável do pedido, sequencial por restaurante (atômica via lock de linha)
create or replace function set_order_number()
returns trigger as $$
declare
  next_number int;
begin
  update restaurants
  set next_order_number = next_order_number + 1
  where id = new.restaurant_id
  returning next_order_number - 1 into next_number;

  new.number = next_number;
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_order_number on orders;
create trigger set_order_number
  before insert on orders
  for each row execute function set_order_number();

-- helpers de autorização (security definer evita recursão de RLS)
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable set search_path = public;

create or replace function is_restaurant_member(target_restaurant_id uuid)
returns boolean as $$
  select exists (
    select 1 from restaurant_users
    where restaurant_id = target_restaurant_id and user_id = auth.uid()
  );
$$ language sql security definer stable set search_path = public;
