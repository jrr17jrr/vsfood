"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createServiceRoleClient, createClient } from "@/lib/supabase/server";
import { slugifyName } from "@/lib/slug";
import { onlyDigits } from "@/lib/format";
import {
  checkSlugSchema,
  createRestaurantByAdminSchema,
  linkExistingOwnerSchema,
  type CreateRestaurantByAdminInput,
  type LinkExistingOwnerInput,
} from "@/lib/validations/admin-restaurant";
import type { AccessType, RestaurantStatus } from "@/types/database";

type Db = ReturnType<typeof createServiceRoleClient>;

type ExistingProfile = { id: string; role: string; name: string };

type CreateResult =
  | { error: string; existingProfile?: ExistingProfile }
  | { name: string; slug: string; ownerEmail: string };

type ProvisionInput = {
  name: string;
  slug: string;
  planId: string;
  accessType: AccessType;
  trialDays: number;
  status: RestaurantStatus;
};

function accessFields(input: Pick<ProvisionInput, "accessType" | "trialDays" | "status">) {
  if (input.accessType === "demo") {
    return { access_type: "demo" as const, is_demo: true, status: "active" as RestaurantStatus };
  }
  if (input.accessType === "trial") {
    const trialStartedAt = new Date();
    const trialExpiresAt = new Date(trialStartedAt);
    trialExpiresAt.setDate(trialExpiresAt.getDate() + input.trialDays);
    return {
      access_type: "trial" as const,
      is_demo: false,
      status: "trial" as RestaurantStatus,
      trial_started_at: trialStartedAt.toISOString(),
      trial_expires_at: trialExpiresAt.toISOString(),
    };
  }
  return { access_type: "subscriber" as const, is_demo: false, status: input.status };
}

async function provisionRestaurant(
  db: Db,
  ownerId: string,
  input: ProvisionInput,
): Promise<{ error: string } | { restaurantId: string }> {
  const { data: slugTaken } = await db.from("restaurants").select("id").eq("slug", input.slug).maybeSingle();
  if (slugTaken) return { error: "Este slug já está em uso." };

  const { data: plan } = await db.from("plans").select("code").eq("id", input.planId).maybeSingle();
  if (!plan) return { error: "Plano não encontrado." };

  const { data: restaurant, error: restaurantError } = await db
    .from("restaurants")
    .insert({
      name: input.name,
      slug: input.slug,
      plan_id: input.planId,
      plan: plan.code,
      ...accessFields(input),
    })
    .select("id")
    .single();

  if (restaurantError || !restaurant) {
    if (restaurantError?.code === "23505") return { error: "Este slug já está em uso." };
    return { error: "Não foi possível criar o restaurante." };
  }

  const { error: membershipError } = await db
    .from("restaurant_users")
    .insert({ restaurant_id: restaurant.id, user_id: ownerId, role: "owner" });
  if (membershipError) return { error: "Não foi possível vincular o responsável ao restaurante." };

  const subscriptionStatus = input.accessType === "trial" ? "trial" : "active";
  await db.from("subscriptions").insert({
    restaurant_id: restaurant.id,
    plan: plan.code,
    status: subscriptionStatus,
  });

  return { restaurantId: restaurant.id };
}

export async function checkSlugAvailabilityAction(slug: string): Promise<{ available: boolean }> {
  await requireAdmin();
  const parsed = checkSlugSchema.safeParse({ slug });
  if (!parsed.success) return { available: false };

  const supabase = await createClient();
  const { data } = await supabase.from("restaurants").select("id").eq("slug", parsed.data.slug).maybeSingle();
  return { available: !data };
}

export async function createRestaurantByAdminAction(
  input: CreateRestaurantByAdminInput,
): Promise<CreateResult> {
  await requireAdmin();

  const parsed = createRestaurantByAdminSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const data = parsed.data;
  const slug = slugifyName(data.slug) || slugifyName(data.name);

  const db = createServiceRoleClient();

  const { data: existing } = await db
    .from("profiles")
    .select("id, role, name")
    .eq("email", data.email)
    .maybeSingle();
  if (existing) {
    return { error: "Este e-mail já possui uma conta no VSFood.", existingProfile: existing };
  }

  const { data: created, error: createUserError } = await db.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    app_metadata: { role: "restaurant_owner" },
    user_metadata: { name: data.ownerName, whatsapp: onlyDigits(data.whatsapp) },
  });

  if (createUserError || !created.user) {
    return { error: "Não foi possível criar o acesso do responsável. Tente novamente." };
  }

  const ownerId = created.user.id;

  const result = await provisionRestaurant(db, ownerId, {
    name: data.name,
    slug,
    planId: data.planId,
    accessType: data.accessType,
    trialDays: data.trialDays,
    status: data.status,
  });

  if ("error" in result) {
    await db.auth.admin.deleteUser(ownerId);
    return { error: result.error };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/restaurantes");

  return { name: data.name, slug, ownerEmail: data.email };
}

export async function linkExistingOwnerAction(
  input: LinkExistingOwnerInput,
): Promise<CreateResult> {
  await requireAdmin();

  const parsed = linkExistingOwnerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const data = parsed.data;
  const slug = slugifyName(data.slug) || slugifyName(data.name);

  const db = createServiceRoleClient();

  const { data: profile } = await db.from("profiles").select("id, role, name, email").eq("id", data.profileId).maybeSingle();
  if (!profile) return { error: "Conta não encontrada." };
  if (profile.role === "admin") {
    return { error: "Esta conta é de um administrador e não pode virar responsável por restaurante." };
  }

  const { data: existingMembership } = await db
    .from("restaurant_users")
    .select("id")
    .eq("user_id", profile.id)
    .limit(1)
    .maybeSingle();
  if (existingMembership) return { error: "Esta conta já é responsável por um restaurante." };

  if (profile.role !== "restaurant_owner") {
    const { error: roleError } = await db.from("profiles").update({ role: "restaurant_owner" }).eq("id", profile.id);
    if (roleError) return { error: "Não foi possível atualizar o tipo da conta." };
  }

  const result = await provisionRestaurant(db, profile.id, {
    name: data.name,
    slug,
    planId: data.planId,
    accessType: data.accessType,
    trialDays: data.trialDays,
    status: data.status,
  });

  if ("error" in result) return { error: result.error };

  revalidatePath("/admin");
  revalidatePath("/admin/restaurantes");

  return { name: data.name, slug, ownerEmail: profile.email ?? "" };
}
