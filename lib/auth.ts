import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminViewRestaurantId } from "@/lib/admin-view";
import type { Profile, RestaurantRole } from "@/types/database";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
});

/**
 * @param returnTo caminho relativo para onde o /login deve mandar o usuário
 * de volta após autenticar (ex: "/checkout"). Sem isso, um cliente que caiu
 * no checkout deslogado voltaria para /minha-conta em vez do carrinho.
 */
export async function requireCustomer(returnTo?: string): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(returnTo ? `/login?redirect=${encodeURIComponent(returnTo)}` : "/login");
  }
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/");
  return profile;
}

/**
 * Garante que o usuário logado é dono/staff de um restaurante e retorna o
 * restaurant_id vinculado. Se ele ainda não tem loja, manda para /sem-loja.
 *
 * Admin é um caso especial: ele nunca tem `restaurant_users` próprio, mas
 * pode estar em "Modo Admin" (cookie setado via `startAdminViewAction`, só
 * depois de `requireAdmin()`) visualizando/editando a loja de um cliente. A
 * fronteira de segurança real continua sendo a RLS (`is_admin()` já libera
 * admin em qualquer restaurante) — o cookie é só roteamento, nunca concede
 * nada por si só.
 */
export const requireRestaurantMembership = cache(async (): Promise<{
  profile: Profile;
  restaurantId: string;
  restaurantRole: RestaurantRole;
  isAdminView: boolean;
}> => {
  const profile = await getCurrentProfile();
  if (!profile) {
    console.error("[requireRestaurantMembership] sem sessão — redirecionando pra /login");
    redirect("/login");
  }
  if (profile.role !== "restaurant_owner" && profile.role !== "admin") {
    console.error(`[requireRestaurantMembership] user=${profile.id} role="${profile.role}" não é restaurant_owner nem admin — redirecionando pra /`);
    redirect("/");
  }

  if (profile.role === "admin") {
    const adminViewRestaurantId = await getAdminViewRestaurantId();
    if (!adminViewRestaurantId) {
      console.error(`[requireRestaurantMembership] admin=${profile.id} sem Modo Admin ativo — redirecionando pra /admin`);
      redirect("/admin");
    }
    console.error(`[requireRestaurantMembership] admin=${profile.id} Modo Admin restaurantId=${adminViewRestaurantId}`);
    return { profile, restaurantId: adminViewRestaurantId, restaurantRole: "owner", isAdminView: true };
  }

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("restaurant_users")
    .select("restaurant_id, role")
    .eq("user_id", profile.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    console.error(`[requireRestaurantMembership] user=${profile.id} role="${profile.role}" sem linha em restaurant_users — redirecionando pra /sem-loja`);
    redirect("/sem-loja");
  }

  console.error(
    `[requireRestaurantMembership] user=${profile.id} membership restaurantId=${membership.restaurant_id} role=${membership.role}`,
  );
  return { profile, restaurantId: membership.restaurant_id, restaurantRole: membership.role, isAdminView: false };
});
