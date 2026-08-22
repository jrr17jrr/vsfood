-- VSFood — extensões e tipos enumerados
create extension if not exists pgcrypto;

do $$ begin
  create type user_role as enum ('customer', 'restaurant_owner', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type restaurant_status as enum ('trial', 'active', 'expired', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type restaurant_role as enum ('owner', 'staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type delivery_type as enum ('delivery', 'pickup');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum (
    'new', 'accepted', 'preparing', 'out_for_delivery',
    'ready_for_pickup', 'completed', 'rejected', 'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'approved', 'rejected', 'cancelled', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('pix_online', 'card_online', 'pix_manual', 'cash', 'card_on_delivery');
exception when duplicate_object then null; end $$;

do $$ begin
  create type coupon_type as enum ('percent', 'fixed');
exception when duplicate_object then null; end $$;
