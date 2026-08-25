"use server";

import { revalidatePath } from "next/cache";
import { requireRestaurantMembership } from "@/lib/auth";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { Order, OrderStatus } from "@/types/database";

const NEGATIVE_STATUSES: OrderStatus[] = ["cancelled", "rejected"];

export async function updateOrderStatusAction(orderId: string, status: OrderStatus): Promise<{ error?: string }> {
  const { restaurantId } = await requireRestaurantMembership();
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (!current) return { error: "Pedido não encontrado." };

  const patch: Partial<Order> = { status };
  if (status === "accepted") patch.accepted_at = new Date().toISOString();
  if (status === "ready_for_pickup") patch.ready_at = new Date().toISOString();
  if (status === "completed") patch.completed_at = new Date().toISOString();
  if (status === "cancelled" || status === "rejected") patch.cancelled_at = new Date().toISOString();

  const { error } = await supabase
    .from("orders")
    .update(patch)
    .eq("id", orderId)
    .eq("restaurant_id", restaurantId);

  if (error) return { error: "Não foi possível atualizar o pedido." };

  // Estoque: só devolve quantidade quando o pedido está indo pra
  // cancelado/recusado pela PRIMEIRA vez (current.status ainda não era um
  // desses) — evita devolver em dobro se a action for chamada de novo pro
  // mesmo pedido. Usa o service role só aqui porque
  // restore_products_stock() é restrita a esse role (mesma RPC do
  // createOrderAction), o resto da action continua no client comum.
  const isNewlyCancelled = NEGATIVE_STATUSES.includes(status) && !NEGATIVE_STATUSES.includes(current.status);
  if (isNewlyCancelled) {
    const db = createServiceRoleClient();
    const { data: items } = await db.from("order_items").select("product_id, quantity").eq("order_id", orderId);
    if (items && items.length > 0) {
      const quantityByProduct = new Map<string, number>();
      for (const item of items) {
        if (!item.product_id) continue; // produto excluído (ON DELETE SET NULL) — nada pra restaurar
        quantityByProduct.set(item.product_id, (quantityByProduct.get(item.product_id) ?? 0) + item.quantity);
      }
      await db.rpc("restore_products_stock", {
        p_items: Array.from(quantityByProduct.entries()).map(([product_id, quantity]) => ({ product_id, quantity })),
      });
    }
  }

  revalidatePath("/painel/pedidos");
  revalidatePath(`/pedido/${orderId}`);
  return {};
}
