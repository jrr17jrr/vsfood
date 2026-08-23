"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { setAdminViewCookie, clearAdminViewCookie } from "@/lib/admin-view";
import { getSafeRedirectPath } from "@/lib/redirect";

/**
 * Entra em "Modo Admin" para uma loja específica: nunca troca role/sessão,
 * só guarda o restaurant_id num cookie que `requireRestaurantMembership()`
 * passa a usar. Quem autoriza a edição de verdade é sempre a RLS
 * (`is_admin()` já libera qualquer restaurante) — isto aqui é roteamento.
 */
export async function startAdminViewAction(restaurantId: string, redirectTo: string = "/painel"): Promise<void> {
  await requireAdmin();

  const supabase = await createClient();
  const { data: restaurant } = await supabase.from("restaurants").select("id").eq("id", restaurantId).maybeSingle();
  if (!restaurant) redirect("/admin/restaurantes");

  await setAdminViewCookie(restaurantId);
  redirect(getSafeRedirectPath(redirectTo, "/painel"));
}

export async function stopAdminViewAction(): Promise<void> {
  await requireAdmin();
  await clearAdminViewCookie();
  redirect("/admin/restaurantes");
}
