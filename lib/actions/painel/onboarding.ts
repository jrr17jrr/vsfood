"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { slugifyName } from "@/lib/slug";
import { createRestaurantSchema, type CreateRestaurantInput } from "@/lib/validations/restaurant";

async function generateUniqueSlug(db: ReturnType<typeof createServiceRoleClient>, name: string): Promise<string> {
  const base = slugifyName(name) || "restaurante";
  let candidate = base;
  let attempt = 1;

  for (;;) {
    const { data } = await db.from("restaurants").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}

export async function createRestaurantAction(input: CreateRestaurantInput): Promise<{ error?: string }> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "restaurant_owner" && profile.role !== "admin") {
    return { error: "Sua conta não pode criar uma loja." };
  }

  const parsed = createRestaurantSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const db = createServiceRoleClient();

  const { data: existingMembership } = await db
    .from("restaurant_users")
    .select("id")
    .eq("user_id", profile.id)
    .limit(1)
    .maybeSingle();
  if (existingMembership) return { error: "Você já possui uma loja." };

  const slug = await generateUniqueSlug(db, parsed.data.name);

  const { data: restaurant, error } = await db
    .from("restaurants")
    .insert({
      slug,
      name: parsed.data.name,
      cuisine_type: parsed.data.cuisineType || null,
      whatsapp: parsed.data.whatsapp || null,
    })
    .select("id")
    .single();

  if (error || !restaurant) return { error: "Não foi possível criar sua loja. Tente novamente." };

  await db.from("restaurant_users").insert({ restaurant_id: restaurant.id, user_id: profile.id, role: "owner" });
  await db.from("subscriptions").insert({ restaurant_id: restaurant.id, plan: "basic", status: "trial" });

  redirect("/painel");
}
