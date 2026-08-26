import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { formatOrderNumber } from "@/lib/format";
import { PAYMENT_METHOD_LABEL } from "@/lib/orders/status";
import type { Order, PrintFormat } from "@/types/database";

export type PrintJobItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string | null;
  options: { groupName: string; optionName: string; price: number }[];
};

/** Estrutura limpa e já calculada — o VSFood Print nunca depende do HTML do painel. */
export type PrintJobPayload = {
  orderId: string;
  number: string;
  createdAt: string;
  customerName: string;
  customerPhone: string | null;
  deliveryType: "delivery" | "pickup";
  address: {
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string | null;
    reference: string | null;
  } | null;
  items: PrintJobItem[];
  notes: string | null;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  changeFor: number | null;
  paymentMethodLabel: string;
  attempt: number;
  restaurantName: string;
  printSettings: {
    format: PrintFormat;
    copies: number;
    showPrices: boolean;
    showAddress: boolean;
    showPhone: boolean;
    showNotes: boolean;
  };
};

/**
 * Recupera jobs presos (app fechou/crashou entre o claim e a confirmação),
 * faz o claim atômico do próximo pendente (claim_next_print_order já usa
 * `for update skip locked` — dois dispositivos nunca pegam o mesmo pedido) e
 * monta o payload limpo da comanda. Tudo calculado aqui, no servidor — o app
 * só recebe números prontos.
 */
export async function claimNextPrintJob(restaurantId: string): Promise<PrintJobPayload | null> {
  const db = createServiceRoleClient();

  await db.rpc("recover_stale_print_orders", { p_stale_minutes: 5 });

  const { data: order } = await db.rpc("claim_next_print_order", { p_restaurant_id: restaurantId });
  if (!order) return null;

  return buildPrintJobPayload(db, order);
}

export async function buildPrintJobPayload(
  db: ReturnType<typeof createServiceRoleClient>,
  order: Order,
): Promise<PrintJobPayload | null> {
  const [{ data: restaurant }, { data: profile }, { data: items }] = await Promise.all([
    db
      .from("restaurants")
      .select("name, print_format, print_copies, print_show_prices, print_show_address, print_show_phone, print_show_notes")
      .eq("id", order.restaurant_id)
      .maybeSingle(),
    db.from("profiles").select("name, whatsapp").eq("id", order.customer_id).maybeSingle(),
    db.from("order_items").select("*").eq("order_id", order.id),
  ]);
  if (!restaurant) return null;

  const itemIds = (items ?? []).map((i) => i.id);
  const { data: options } = itemIds.length
    ? await db.from("order_item_options").select("*").in("order_item_id", itemIds)
    : { data: [] };

  return {
    orderId: order.id,
    number: formatOrderNumber(order.number),
    createdAt: order.created_at,
    customerName: profile?.name ?? "Cliente",
    customerPhone: profile?.whatsapp ?? null,
    deliveryType: order.delivery_type,
    address:
      order.delivery_type === "delivery" && order.address_snapshot
        ? {
            street: order.address_snapshot.street,
            number: order.address_snapshot.number,
            complement: order.address_snapshot.complement,
            neighborhood: order.address_snapshot.neighborhood,
            city: order.address_snapshot.city,
            state: order.address_snapshot.state,
            reference: order.address_snapshot.reference,
          }
        : null,
    items: (items ?? []).map((item) => ({
      name: item.name_snapshot,
      quantity: item.quantity,
      unitPrice: item.price_snapshot,
      subtotal: item.subtotal,
      notes: item.notes,
      options: (options ?? [])
        .filter((o) => o.order_item_id === item.id)
        .map((o) => ({ groupName: o.group_name_snapshot, optionName: o.option_name_snapshot, price: o.price_snapshot })),
    })),
    notes: order.notes,
    subtotal: order.subtotal,
    deliveryFee: order.delivery_fee,
    discount: order.discount,
    total: order.total,
    changeFor: order.change_for,
    paymentMethodLabel: PAYMENT_METHOD_LABEL[order.payment_method],
    attempt: order.print_attempts,
    restaurantName: restaurant.name,
    printSettings: {
      format: restaurant.print_format,
      copies: restaurant.print_copies,
      showPrices: restaurant.print_show_prices,
      showAddress: restaurant.print_show_address,
      showPhone: restaurant.print_show_phone,
      showNotes: restaurant.print_show_notes,
    },
  };
}
