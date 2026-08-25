"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRestaurantMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const zoneSchema = z.object({
  neighborhood: z.string().trim().min(1, "Informe o bairro"),
  fee: z.number().min(0, "Informe uma taxa válida"),
  active: z.boolean(),
  minOrderValue: z.number().min(0).nullable().optional(),
  estimatedTimeMinutes: z.number().int().min(0).nullable().optional(),
});
export type DeliveryZoneInput = z.infer<typeof zoneSchema>;

type Result = { error?: string };

function revalidateDelivery() {
  revalidatePath("/painel/entrega");
  revalidatePath("/checkout");
}

export async function createDeliveryZoneAction(input: DeliveryZoneInput): Promise<Result> {
  const { restaurantId } = await requireRestaurantMembership();
  const parsed = zoneSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { count } = await supabase
    .from("delivery_zones")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId);

  const { error } = await supabase.from("delivery_zones").insert({
    restaurant_id: restaurantId,
    neighborhood: parsed.data.neighborhood,
    fee: parsed.data.fee,
    active: parsed.data.active,
    min_order_value: parsed.data.minOrderValue ?? null,
    estimated_time_minutes: parsed.data.estimatedTimeMinutes ?? null,
    order: count ?? 0,
  });
  if (error) return { error: "Não foi possível criar a região." };
  revalidateDelivery();
  return {};
}

export async function updateDeliveryZoneAction(id: string, input: DeliveryZoneInput): Promise<Result> {
  await requireRestaurantMembership();
  const parsed = zoneSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("delivery_zones")
    .update({
      neighborhood: parsed.data.neighborhood,
      fee: parsed.data.fee,
      active: parsed.data.active,
      min_order_value: parsed.data.minOrderValue ?? null,
      estimated_time_minutes: parsed.data.estimatedTimeMinutes ?? null,
    })
    .eq("id", id);
  if (error) return { error: "Não foi possível atualizar a região." };
  revalidateDelivery();
  return {};
}

export async function deleteDeliveryZoneAction(id: string): Promise<Result> {
  await requireRestaurantMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir a região." };
  revalidateDelivery();
  return {};
}

/** Drag-and-drop das regiões — mesmo padrão de reorder em lote do cardápio (aplica o índice de cada id na nova ordem). */
export async function reorderDeliveryZonesAction(orderedIds: string[]): Promise<Result> {
  const { restaurantId } = await requireRestaurantMembership();
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("delivery_zones").update({ order: index }).eq("id", id).eq("restaurant_id", restaurantId),
    ),
  );
  revalidateDelivery();
  return {};
}

const deliverySettingsSchema = z.object({
  deliveryEnabled: z.boolean(),
  pickupEnabled: z.boolean(),
  minOrderValue: z.number().min(0),
  estimatedTimeMinutes: z.number().int().min(0),
  freeShippingThreshold: z.number().min(0).nullable(),
  pickupMinOrderValue: z.number().min(0).nullable(),
  pickupEstimatedTimeMinutes: z.number().int().min(0).nullable(),
});
export type DeliverySettingsInput = z.infer<typeof deliverySettingsSchema>;

/**
 * Configurações gerais de entrega/retirada do restaurante. min_order_value e
 * estimated_time_minutes já existiam (editados também em /painel/aparencia)
 * — aqui só reaproveita as mesmas colunas, sem duplicar dado.
 */
export async function updateDeliverySettingsAction(input: DeliverySettingsInput): Promise<Result> {
  const { restaurantId } = await requireRestaurantMembership();
  const parsed = deliverySettingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  if (!parsed.data.deliveryEnabled && !parsed.data.pickupEnabled) {
    return { error: "Pelo menos um método (entrega ou retirada) precisa ficar habilitado." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update({
      delivery_enabled: parsed.data.deliveryEnabled,
      pickup_enabled: parsed.data.pickupEnabled,
      min_order_value: parsed.data.minOrderValue,
      estimated_time_minutes: parsed.data.estimatedTimeMinutes,
      free_shipping_threshold: parsed.data.freeShippingThreshold,
      pickup_min_order_value: parsed.data.pickupMinOrderValue,
      pickup_estimated_time_minutes: parsed.data.pickupEstimatedTimeMinutes,
    })
    .eq("id", restaurantId);
  if (error) return { error: "Não foi possível salvar as configurações de entrega." };
  revalidateDelivery();
  revalidatePath("/painel", "layout");
  return {};
}
