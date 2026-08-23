"use server";

import { revalidatePath } from "next/cache";
import { requireRestaurantMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { restaurantAppearanceSchema, type RestaurantAppearanceInput } from "@/lib/validations/restaurant";
import { DEFAULT_STORE_THEME } from "@/lib/theme/store-theme";

export async function toggleOrdersPausedAction(paused: boolean): Promise<{ error?: string }> {
  const { restaurantId } = await requireRestaurantMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("restaurants").update({ orders_paused: paused }).eq("id", restaurantId);
  if (error) return { error: "Não foi possível atualizar o status da loja." };
  revalidatePath("/painel", "layout");
  return {};
}

export async function updateAppearanceAction(
  input: RestaurantAppearanceInput & { logoUrl?: string | null; bannerUrl?: string | null },
): Promise<{ error?: string }> {
  const { restaurantId } = await requireRestaurantMembership();
  const parsed = restaurantAppearanceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      cuisine_type: parsed.data.cuisineType || null,
      primary_color: parsed.data.theme.primary,
      theme: parsed.data.theme,
      whatsapp: parsed.data.whatsapp || null,
      instagram: parsed.data.instagram || null,
      phone: parsed.data.phone || null,
      cep: parsed.data.cep || null,
      street: parsed.data.street || null,
      number: parsed.data.number || null,
      complement: parsed.data.complement || null,
      neighborhood: parsed.data.neighborhood || null,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
      min_order_value: parsed.data.minOrderValue,
      estimated_time_minutes: parsed.data.estimatedTimeMinutes,
      ...(input.logoUrl !== undefined ? { logo_url: input.logoUrl } : {}),
      ...(input.bannerUrl !== undefined ? { banner_url: input.bannerUrl } : {}),
    })
    .eq("id", restaurantId);

  if (error) return { error: "Não foi possível salvar as alterações." };
  revalidatePath("/painel", "layout");
  return {};
}

export async function resetThemeAction(): Promise<{ error?: string }> {
  const { restaurantId } = await requireRestaurantMembership();
  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update({ theme: DEFAULT_STORE_THEME, primary_color: DEFAULT_STORE_THEME.primary })
    .eq("id", restaurantId);

  if (error) return { error: "Não foi possível restaurar o padrão." };
  revalidatePath("/painel", "layout");
  revalidatePath("/loja", "layout");
  return {};
}
