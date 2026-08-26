"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRestaurantMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { geocodeAddress, type GeocodeResult } from "@/lib/geocoding/nominatim";

const zoneSchema = z.object({
  state: z
    .string()
    .trim()
    .length(2, "Informe a UF (2 letras)")
    .transform((v) => v.toUpperCase()),
  city: z.string().trim().min(1, "Informe a cidade"),
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
    state: parsed.data.state,
    city: parsed.data.city,
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
      state: parsed.data.state,
      city: parsed.data.city,
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

/** Toggle rápido de pausa (não mexe nas outras configurações — só liga/desliga). */
export async function updatePauseStateAction(input: { deliveryEnabled: boolean; pickupEnabled: boolean }): Promise<Result> {
  const { restaurantId } = await requireRestaurantMembership();
  if (!input.deliveryEnabled && !input.pickupEnabled) {
    return { error: "Pelo menos um método (entrega ou retirada) precisa ficar habilitado." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update({ delivery_enabled: input.deliveryEnabled, pickup_enabled: input.pickupEnabled })
    .eq("id", restaurantId);
  if (error) return { error: "Não foi possível atualizar o status." };
  revalidateDelivery();
  revalidatePath("/painel", "layout");
  return {};
}

/** Busca de endereço pro mapa (centralizar antes de ajustar o pino manualmente). */
export async function searchAddressAction(query: string): Promise<GeocodeResult | null> {
  await requireRestaurantMembership();
  if (!query.trim()) return null;
  return geocodeAddress(`${query}, Brasil`);
}

const storeLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  deliveryRadiusKm: z.number().positive().max(100),
});
export type StoreLocationInput = z.infer<typeof storeLocationSchema>;

export async function updateStoreLocationAction(input: StoreLocationInput): Promise<Result> {
  const { restaurantId } = await requireRestaurantMembership();
  const parsed = storeLocationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update({
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      delivery_radius_km: parsed.data.deliveryRadiusKm,
    })
    .eq("id", restaurantId);
  if (error) return { error: "Não foi possível salvar a localização da loja." };
  revalidateDelivery();
  return {};
}

const chargeModeSchema = z
  .object({
    mode: z.enum(["neighborhood", "fixed", "per_km", "tiered"]),
    baseFee: z.number().min(0).nullable().optional(),
    feePerKm: z.number().min(0).nullable().optional(),
  })
  .refine((v) => v.mode !== "fixed" || (v.baseFee ?? 0) >= 0, { message: "Informe a taxa fixa", path: ["baseFee"] });
export type ChargeModeInput = z.infer<typeof chargeModeSchema>;

export async function updateChargeModeAction(input: ChargeModeInput): Promise<Result> {
  const { restaurantId } = await requireRestaurantMembership();
  const parsed = chargeModeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update({
      delivery_charge_mode: parsed.data.mode,
      delivery_base_fee: parsed.data.baseFee ?? null,
      delivery_fee_per_km: parsed.data.feePerKm ?? null,
    })
    .eq("id", restaurantId);
  if (error) return { error: "Não foi possível salvar a forma de cobrança." };
  revalidateDelivery();
  return {};
}

const tierSchema = z.object({
  maxDistanceKm: z.number().positive("Informe a distância máxima"),
  fee: z.number().min(0, "Informe uma taxa válida"),
});
export type DeliveryTierInput = z.infer<typeof tierSchema>;

export async function createDistanceTierAction(input: DeliveryTierInput): Promise<Result> {
  const { restaurantId } = await requireRestaurantMembership();
  const parsed = tierSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { count } = await supabase
    .from("delivery_distance_tiers")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId);

  const { error } = await supabase.from("delivery_distance_tiers").insert({
    restaurant_id: restaurantId,
    max_distance_km: parsed.data.maxDistanceKm,
    fee: parsed.data.fee,
    order: count ?? 0,
  });
  if (error) return { error: "Não foi possível criar a faixa." };
  revalidateDelivery();
  return {};
}

export async function updateDistanceTierAction(id: string, input: DeliveryTierInput): Promise<Result> {
  await requireRestaurantMembership();
  const parsed = tierSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("delivery_distance_tiers")
    .update({ max_distance_km: parsed.data.maxDistanceKm, fee: parsed.data.fee })
    .eq("id", id);
  if (error) return { error: "Não foi possível atualizar a faixa." };
  revalidateDelivery();
  return {};
}

export async function deleteDistanceTierAction(id: string): Promise<Result> {
  await requireRestaurantMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("delivery_distance_tiers").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir a faixa." };
  revalidateDelivery();
  return {};
}
