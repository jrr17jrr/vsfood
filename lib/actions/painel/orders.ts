"use server";

import { revalidatePath } from "next/cache";
import { requireRestaurantMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderStatus } from "@/types/database";

export async function updateOrderStatusAction(orderId: string, status: OrderStatus): Promise<{ error?: string }> {
  const { restaurantId } = await requireRestaurantMembership();
  const supabase = await createClient();

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
  revalidatePath("/painel/pedidos");
  revalidatePath(`/pedido/${orderId}`);
  return {};
}
