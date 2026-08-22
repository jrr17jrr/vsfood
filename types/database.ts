// Tipos gerados manualmente a partir de supabase/migrations/*.sql
// Mantenha em sincronia ao alterar o schema.
//
// IMPORTANTE: use sempre `type X = { ... }` (nunca `interface`) para as Rows.
// O supabase-js valida a constraint `Database[Schema] extends GenericSchema`
// via tipos condicionais, e `interface` não satisfaz essa checagem estrutural
// contra `Record<string, unknown>` da mesma forma que um alias de objeto.

export type UserRole = "customer" | "restaurant_owner" | "admin";
export type RestaurantStatus = "trial" | "active" | "expired" | "suspended";
export type RestaurantRole = "owner" | "staff";
export type DeliveryType = "delivery" | "pickup";
export type OrderStatus =
  | "new"
  | "accepted"
  | "preparing"
  | "out_for_delivery"
  | "ready_for_pickup"
  | "completed"
  | "rejected"
  | "cancelled";
export type PaymentStatus = "pending" | "approved" | "rejected" | "cancelled" | "refunded";
export type PaymentMethod = "pix_online" | "card_online" | "pix_manual" | "cash" | "card_on_delivery";
export type CouponType = "percent" | "fixed";

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export type Profile = Timestamps & {
  id: string;
  role: UserRole;
  name: string;
  whatsapp: string | null;
  email: string | null;
  avatar_url: string | null;
  provider: string;
};

export type Restaurant = Timestamps & {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cuisine_type: string | null;
  logo_url: string | null;
  banner_url: string | null;
  primary_color: string;
  whatsapp: string | null;
  instagram: string | null;
  phone: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  status: RestaurantStatus;
  trial_started_at: string;
  trial_expires_at: string;
  plan: string;
  orders_paused: boolean;
  min_order_value: number;
  estimated_time_minutes: number;
  next_order_number: number;
};

export type RestaurantUser = {
  id: string;
  restaurant_id: string;
  user_id: string;
  role: RestaurantRole;
  created_at: string;
};

export type Subscription = Timestamps & {
  id: string;
  restaurant_id: string;
  plan: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
};

export type Category = Timestamps & {
  id: string;
  restaurant_id: string;
  name: string;
  order: number;
  active: boolean;
};

export type Product = Timestamps & {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  promo_price: number | null;
  image_url: string | null;
  available: boolean;
  featured: boolean;
  order: number;
};

export type ProductOptionGroup = Timestamps & {
  id: string;
  product_id: string;
  name: string;
  required: boolean;
  min_select: number;
  max_select: number;
  order: number;
};

export type ProductOption = Timestamps & {
  id: string;
  group_id: string;
  name: string;
  price: number;
  available: boolean;
  order: number;
};

export type CustomerAddress = Timestamps & {
  id: string;
  user_id: string;
  label: string | null;
  cep: string | null;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string | null;
  reference: string | null;
  is_default: boolean;
};

export type DeliveryZone = Timestamps & {
  id: string;
  restaurant_id: string;
  neighborhood: string;
  fee: number;
  active: boolean;
};

export type OpeningHour = {
  id: string;
  restaurant_id: string;
  weekday: number;
  opens_at: string;
  closes_at: string;
  created_at: string;
};

export type Coupon = Timestamps & {
  id: string;
  restaurant_id: string;
  code: string;
  type: CouponType;
  value: number;
  min_order_value: number;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  used_count: number;
  active: boolean;
};

export type CouponUsage = {
  id: string;
  coupon_id: string;
  order_id: string;
  user_id: string | null;
  created_at: string;
};

export type AddressSnapshot = {
  cep: string | null;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string | null;
  reference: string | null;
};

export type Order = Timestamps & {
  id: string;
  number: number;
  restaurant_id: string;
  customer_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  delivery_type: DeliveryType;
  address_snapshot: AddressSnapshot | null;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  coupon_id: string | null;
  notes: string | null;
  change_for: number | null;
  accepted_at: string | null;
  ready_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  name_snapshot: string;
  price_snapshot: number;
  quantity: number;
  notes: string | null;
  subtotal: number;
  created_at: string;
};

export type OrderItemOption = {
  id: string;
  order_item_id: string;
  group_name_snapshot: string;
  option_name_snapshot: string;
  price_snapshot: number;
  created_at: string;
};

export type Payment = Timestamps & {
  id: string;
  restaurant_id: string;
  order_id: string;
  provider: string;
  provider_payment_id: string | null;
  method: string;
  status: PaymentStatus;
  amount: number;
  idempotency_key: string;
  raw_payload: Record<string, unknown> | null;
};

export type MercadoPagoConnection = Timestamps & {
  id: string;
  restaurant_id: string;
  mp_user_id: string | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  public_key: string | null;
  expires_at: string | null;
  connected_at: string | null;
  status: string;
};

export type Review = {
  id: string;
  customer_id: string;
  restaurant_id: string;
  order_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type TableDef<Row extends Record<string, unknown>, InsertOverrides extends object = object> = {
  Row: Row;
  Insert: Partial<Row> & InsertOverrides;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<Profile, { id: string; name: string }>;
      restaurants: TableDef<Restaurant, { slug: string; name: string }>;
      restaurant_users: TableDef<RestaurantUser, { restaurant_id: string; user_id: string }>;
      subscriptions: TableDef<Subscription, { restaurant_id: string }>;
      categories: TableDef<Category, { restaurant_id: string; name: string }>;
      products: TableDef<Product, { restaurant_id: string; name: string; price: number }>;
      product_option_groups: TableDef<ProductOptionGroup, { product_id: string; name: string }>;
      product_options: TableDef<ProductOption, { group_id: string; name: string }>;
      customer_addresses: TableDef<
        CustomerAddress,
        { user_id: string; street: string; number: string; neighborhood: string; city: string }
      >;
      delivery_zones: TableDef<DeliveryZone, { restaurant_id: string; neighborhood: string }>;
      opening_hours: TableDef<
        OpeningHour,
        { restaurant_id: string; weekday: number; opens_at: string; closes_at: string }
      >;
      coupons: TableDef<Coupon, { restaurant_id: string; code: string; type: CouponType; value: number }>;
      coupon_usages: TableDef<CouponUsage, { coupon_id: string; order_id: string }>;
      orders: TableDef<
        Order,
        {
          restaurant_id: string;
          customer_id: string;
          payment_method: PaymentMethod;
          delivery_type: DeliveryType;
        }
      >;
      order_items: TableDef<
        OrderItem,
        { order_id: string; name_snapshot: string; price_snapshot: number; quantity: number; subtotal: number }
      >;
      order_item_options: TableDef<
        OrderItemOption,
        { order_item_id: string; group_name_snapshot: string; option_name_snapshot: string }
      >;
      payments: TableDef<
        Payment,
        { restaurant_id: string; order_id: string; method: string; amount: number; idempotency_key: string }
      >;
      mercadopago_connections: TableDef<MercadoPagoConnection, { restaurant_id: string }>;
      reviews: TableDef<Review, { customer_id: string; restaurant_id: string; order_id: string; rating: number }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
