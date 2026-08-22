"use server";

import { revalidatePath } from "next/cache";
import { requireRestaurantMembership } from "@/lib/auth";
import { disconnectRestaurant } from "@/lib/mercadopago/connection";

export async function disconnectMercadoPagoAction(): Promise<{ error?: string }> {
  const { restaurantId } = await requireRestaurantMembership();
  await disconnectRestaurant(restaurantId);
  revalidatePath("/painel/pagamentos");
  return {};
}
