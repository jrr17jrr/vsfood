"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRestaurantMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const zoneSchema = z.object({
  neighborhood: z.string().trim().min(1, "Informe o bairro"),
  fee: z.number().min(0, "Informe uma taxa válida"),
  active: z.boolean(),
});
export type DeliveryZoneInput = z.infer<typeof zoneSchema>;

type Result = { error?: string };

export async function createDeliveryZoneAction(input: DeliveryZoneInput): Promise<Result> {
  const { restaurantId } = await requireRestaurantMembership();
  const parsed = zoneSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("delivery_zones").insert({
    restaurant_id: restaurantId,
    neighborhood: parsed.data.neighborhood,
    fee: parsed.data.fee,
    active: parsed.data.active,
  });
  if (error) return { error: "Não foi possível criar a região." };
  revalidatePath("/painel/entrega");
  return {};
}

export async function updateDeliveryZoneAction(id: string, input: DeliveryZoneInput): Promise<Result> {
  await requireRestaurantMembership();
  const parsed = zoneSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("delivery_zones")
    .update({ neighborhood: parsed.data.neighborhood, fee: parsed.data.fee, active: parsed.data.active })
    .eq("id", id);
  if (error) return { error: "Não foi possível atualizar a região." };
  revalidatePath("/painel/entrega");
  return {};
}

export async function deleteDeliveryZoneAction(id: string): Promise<Result> {
  await requireRestaurantMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir a região." };
  revalidatePath("/painel/entrega");
  return {};
}
