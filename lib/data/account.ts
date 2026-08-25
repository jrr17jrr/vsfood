import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CustomerAddress, Order, OrderItem, OrderItemOption } from "@/types/database";

export async function getCustomerAddresses(userId: string): Promise<CustomerAddress[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export type OrderListItem = Order & { restaurant_name: string; restaurant_slug: string };

export async function getCustomerOrders(userId: string): Promise<OrderListItem[]> {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", userId)
    .order("created_at", { ascending: false });

  if (!orders || orders.length === 0) return [];

  const restaurantIds = [...new Set(orders.map((o) => o.restaurant_id))];
  const { data: restaurants } = await supabase.from("restaurants").select("id, name, slug").in("id", restaurantIds);
  const restaurantMap = new Map((restaurants ?? []).map((r) => [r.id, r]));

  return orders.map((o) => {
    const restaurant = restaurantMap.get(o.restaurant_id);
    return { ...o, restaurant_name: restaurant?.name ?? "", restaurant_slug: restaurant?.slug ?? "" };
  });
}

export type OrderDetail = Order & {
  restaurant_name: string;
  restaurant_slug: string;
  restaurant_whatsapp: string | null;
  /** Endereço do estabelecimento — só usado quando delivery_type é "pickup". */
  restaurant_address: {
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
  } | null;
  items: (OrderItem & { options: OrderItemOption[] })[];
  pix: { qrCode: string; qrCodeBase64: string } | null;
};

export async function getOrderDetail(orderId: string): Promise<OrderDetail | null> {
  const supabase = await createClient();

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return null;

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name, slug, whatsapp, street, number, complement, neighborhood, city, state")
    .eq("id", order.restaurant_id)
    .maybeSingle();

  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", orderId);
  const itemIds = (items ?? []).map((i) => i.id);

  const { data: options } = itemIds.length
    ? await supabase.from("order_item_options").select("*").in("order_item_id", itemIds)
    : { data: [] };

  let pix: { qrCode: string; qrCodeBase64: string } | null = null;
  if (order.payment_method === "pix_online") {
    const { data: payment } = await supabase
      .from("payments")
      .select("raw_payload")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const raw = payment?.raw_payload as
      | { point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string } } }
      | undefined;
    const transactionData = raw?.point_of_interaction?.transaction_data;
    if (transactionData?.qr_code && transactionData?.qr_code_base64) {
      pix = { qrCode: transactionData.qr_code, qrCodeBase64: transactionData.qr_code_base64 };
    }
  }

  return {
    ...order,
    restaurant_name: restaurant?.name ?? "",
    restaurant_slug: restaurant?.slug ?? "",
    restaurant_whatsapp: restaurant?.whatsapp ?? null,
    restaurant_address: restaurant?.street
      ? {
          street: restaurant.street,
          number: restaurant.number,
          complement: restaurant.complement,
          neighborhood: restaurant.neighborhood,
          city: restaurant.city,
          state: restaurant.state,
        }
      : null,
    items: (items ?? []).map((i) => ({
      ...i,
      options: (options ?? []).filter((o) => o.order_item_id === i.id),
    })),
    pix,
  };
}
