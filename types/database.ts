// Tipos gerados manualmente a partir de supabase/migrations/*.sql
// Mantenha em sincronia ao alterar o schema.
//
// IMPORTANTE: use sempre `type X = { ... }` (nunca `interface`) para as Rows.
// O supabase-js valida a constraint `Database[Schema] extends GenericSchema`
// via tipos condicionais, e `interface` não satisfaz essa checagem estrutural
// contra `Record<string, unknown>` da mesma forma que um alias de objeto.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

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
export type CouponType = "percent" | "fixed" | "free_shipping";
export type DeliveryChargeMode = "neighborhood" | "fixed" | "per_km" | "tiered";
export type PrintStatus = "pending" | "processing" | "printed" | "failed";
export type PrintFormat = "a4" | "80mm" | "58mm";
export type AccessType = "trial" | "subscriber" | "demo";

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
  theme: Record<string, string> | null;
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
  plan_id: string | null;
  access_type: AccessType;
  is_demo: boolean;
  orders_paused: boolean;
  min_order_value: number;
  estimated_time_minutes: number;
  next_order_number: number;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  free_shipping_threshold: number | null;
  pickup_min_order_value: number | null;
  pickup_estimated_time_minutes: number | null;
  latitude: number | null;
  longitude: number | null;
  delivery_radius_km: number | null;
  delivery_charge_mode: DeliveryChargeMode;
  delivery_base_fee: number | null;
  delivery_fee_per_km: number | null;
  auto_accept_orders: boolean;
  auto_print_enabled: boolean;
  print_format: PrintFormat;
  print_copies: number;
  print_show_prices: boolean;
  print_show_address: boolean;
  print_show_phone: boolean;
  print_show_notes: boolean;
};

export type Plan = Timestamps & {
  id: string;
  code: string;
  name: string;
  description: string | null;
  complement_text: string | null;
  cta_label: string;
  price_monthly: number | null;
  price_yearly: number | null;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  trial_days_default: number;
};

export type PlanFeature = Timestamps & {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
};

export type PlanFeatureLink = {
  plan_id: string;
  feature_id: string;
  created_at: string;
};

export type PlanLimit = Timestamps & {
  id: string;
  plan_id: string;
  key: string;
  value: number | null;
};

export type TrialSettings = Timestamps & {
  id: string;
  is_active: boolean;
  default_days: number;
  default_plan_id: string | null;
  headline_template: string;
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
  unlimited_stock: boolean;
  stock_quantity: number;
};

export type OptionGroupPricingMode = "no_charge" | "per_option" | "free_first_n" | "highest_only" | "fixed_price";

export type ProductOptionGroup = Timestamps & {
  id: string;
  product_id: string;
  name: string;
  required: boolean;
  min_select: number;
  max_select: number;
  pricing_mode: OptionGroupPricingMode;
  free_quantity: number;
  fixed_price: number;
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
  latitude: number | null;
  longitude: number | null;
};

export type DeliveryZone = Timestamps & {
  id: string;
  restaurant_id: string;
  neighborhood: string;
  state: string | null;
  city: string | null;
  fee: number;
  active: boolean;
  min_order_value: number | null;
  estimated_time_minutes: number | null;
  order: number;
};

export type DeliveryDistanceTier = Timestamps & {
  id: string;
  restaurant_id: string;
  max_distance_km: number;
  fee: number;
  order: number;
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
  max_discount_value: number | null;
  usage_limit_per_customer: number | null;
  applies_to_delivery: boolean;
  applies_to_pickup: boolean;
  first_purchase_only: boolean;
  applies_to_all_products: boolean;
};

export type CouponUsage = {
  id: string;
  coupon_id: string;
  order_id: string;
  user_id: string | null;
  created_at: string;
};

export type CouponCategory = {
  coupon_id: string;
  category_id: string;
};

export type CouponProduct = {
  coupon_id: string;
  product_id: string;
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
  estimated_time_minutes: number | null;
  accepted_at: string | null;
  ready_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  print_status: PrintStatus;
  print_attempts: number;
  last_print_attempt_at: string | null;
  printed_at: string | null;
  print_error: string | null;
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
      delivery_distance_tiers: TableDef<DeliveryDistanceTier, { restaurant_id: string; max_distance_km: number; fee: number }>;
      opening_hours: TableDef<
        OpeningHour,
        { restaurant_id: string; weekday: number; opens_at: string; closes_at: string }
      >;
      coupons: TableDef<Coupon, { restaurant_id: string; code: string; type: CouponType; value: number }>;
      coupon_usages: TableDef<CouponUsage, { coupon_id: string; order_id: string }>;
      coupon_categories: TableDef<CouponCategory, { coupon_id: string; category_id: string }>;
      coupon_products: TableDef<CouponProduct, { coupon_id: string; product_id: string }>;
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
      plans: TableDef<Plan, { code: string; name: string }>;
      plan_features: TableDef<PlanFeature, { key: string; name: string }>;
      plan_feature_links: TableDef<PlanFeatureLink, { plan_id: string; feature_id: string }>;
      plan_limits: TableDef<PlanLimit, { plan_id: string; key: string }>;
      trial_settings: TableDef<TrialSettings, object>;
    };
    Views: Record<string, never>;
    Functions: {
      decrement_products_stock: { Args: { p_items: Json }; Returns: void };
      restore_products_stock: { Args: { p_items: Json }; Returns: void };
      duplicate_product: { Args: { p_product_id: string; p_restaurant_id: string }; Returns: string };
      duplicate_category: { Args: { p_category_id: string; p_restaurant_id: string }; Returns: string };
      claim_next_print_order: { Args: { p_restaurant_id: string }; Returns: Order | null };
    };
  };
};
