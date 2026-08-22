import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
 * restaurant_id vinculado. Se ele ainda não tem loja, manda para o onboarding.
 */
export const requireRestaurantMembership = cache(async (): Promise<{
  profile: Profile;
  restaurantId: string;
  restaurantRole: RestaurantRole;
}> => {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "restaurant_owner" && profile.role !== "admin") redirect("/");

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("restaurant_users")
    .select("restaurant_id, role")
    .eq("user_id", profile.id)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/painel/criar-loja");

  return { profile, restaurantId: membership.restaurant_id, restaurantRole: membership.role };
});
