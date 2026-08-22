-- VSFood — tabelas principais

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'customer',
  name text not null,
  whatsapp text,
  email text,
  avatar_url text,
  provider text not null default 'email',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_whatsapp_idx on profiles (whatsapp) where whatsapp is not null;

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  cuisine_type text,
  logo_url text,
  banner_url text,
  primary_color text not null default '#F0631D',
  whatsapp text,
  instagram text,
  phone text,
  cep text,
  street text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  status restaurant_status not null default 'trial',
  trial_started_at timestamptz not null default now(),
  trial_expires_at timestamptz not null default (now() + interval '7 days'),
  plan text not null default 'basic',
  orders_paused boolean not null default false,
  min_order_value numeric(10,2) not null default 0,
  estimated_time_minutes int not null default 40,
  next_order_number int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists restaurants_status_idx on restaurants (status);

create table if not exists restaurant_users (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role restaurant_role not null default 'owner',
  created_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);
create index if not exists restaurant_users_user_idx on restaurant_users (user_id);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null unique references restaurants(id) on delete cascade,
  plan text not null default 'basic',
  status text not null default 'trial',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  "order" int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists categories_restaurant_idx on categories (restaurant_id, "order");

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  promo_price numeric(10,2) check (promo_price is null or promo_price >= 0),
  image_url text,
  available boolean not null default true,
  featured boolean not null default false,
  "order" int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_restaurant_idx on products (restaurant_id, category_id, "order");

create table if not exists product_option_groups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  required boolean not null default false,
  min_select int not null default 0,
  max_select int not null default 1,
  "order" int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists product_option_groups_product_idx on product_option_groups (product_id, "order");

create table if not exists product_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references product_option_groups(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null default 0,
  available boolean not null default true,
  "order" int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists product_options_group_idx on product_options (group_id, "order");

create table if not exists customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  label text,
  cep text,
  street text not null,
  number text not null,
  complement text,
  neighborhood text not null,
  city text not null,
  state text,
  reference text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customer_addresses_user_idx on customer_addresses (user_id);

create table if not exists delivery_zones (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  neighborhood text not null,
  fee numeric(10,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists delivery_zones_restaurant_idx on delivery_zones (restaurant_id);

create table if not exists opening_hours (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  created_at timestamptz not null default now()
);
create index if not exists opening_hours_restaurant_idx on opening_hours (restaurant_id, weekday);

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  code text not null,
  type coupon_type not null,
  value numeric(10,2) not null check (value >= 0),
  min_order_value numeric(10,2) not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit int,
  used_count int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, code)
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  number int not null,
  restaurant_id uuid not null references restaurants(id),
  customer_id uuid not null references profiles(id),
  status order_status not null default 'new',
  payment_status payment_status not null default 'pending',
  payment_method payment_method not null,
  delivery_type delivery_type not null,
  address_snapshot jsonb,
  subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  coupon_id uuid references coupons(id) on delete set null,
  notes text,
  change_for numeric(10,2),
  accepted_at timestamptz,
  ready_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, number)
);
create index if not exists orders_restaurant_idx on orders (restaurant_id, created_at desc);
create index if not exists orders_customer_idx on orders (customer_id, created_at desc);

create table if not exists coupon_usages (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  name_snapshot text not null,
  price_snapshot numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  notes text,
  subtotal numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists order_items_order_idx on order_items (order_id);

create table if not exists order_item_options (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items(id) on delete cascade,
  group_name_snapshot text not null,
  option_name_snapshot text not null,
  price_snapshot numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists order_item_options_item_idx on order_item_options (order_item_id);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id),
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null default 'mercadopago',
  provider_payment_id text,
  method text not null,
  status payment_status not null default 'pending',
  amount numeric(10,2) not null,
  idempotency_key text not null unique,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_order_idx on payments (order_id);
create index if not exists payments_provider_payment_idx on payments (provider_payment_id);

create table if not exists mercadopago_connections (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null unique references restaurants(id) on delete cascade,
  mp_user_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  public_key text,
  expires_at timestamptz,
  connected_at timestamptz default now(),
  status text not null default 'connected',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  order_id uuid not null unique references orders(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
create index if not exists reviews_restaurant_idx on reviews (restaurant_id);
