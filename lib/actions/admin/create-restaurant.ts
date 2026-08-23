"use server";

import { revalidatePath } from "next/cache";
import type { AuthError } from "@supabase/supabase-js";
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
  | { name: string; slug: string; ownerEmail: string; warning?: string };

type ProvisionInput = {
  name: string;
  slug: string;
  planId: string;
  accessType: AccessType;
  trialDays: number;
  status: RestaurantStatus;
};

type ProvisionResult = { error: string } | { restaurantId: string; warning?: string };

function log(stage: string, detail: unknown) {
  // Server-only: nunca exposto ao client. Serve pra diagnosticar no log da
  // Vercel/Supabase qual etapa exata falhou, sem vazar isso pro browser.
  console.error(`[admin/create-restaurant] ${stage}`, detail);
}

/**
 * `auth.admin.createUser` devolve um AuthError genérico (ex: "Database error
 * creating new user") tanto pra colisão de UNIQUE em profiles (trigger
 * handle_new_auth_user) quanto pra chave de service role inválida. Aqui a
 * gente distingue o que dá pra distinguir pelo status/mensagem, pra não
 * devolver só "tente novamente" pro admin.
 */
function describeAuthError(error: AuthError): string {
  const msg = error.message.toLowerCase();

  if (msg.includes("already been registered") || msg.includes("already registered") || error.code === "email_exists") {
    return "E-mail já cadastrado no Supabase Auth, mas sem perfil correspondente no VSFood. Verifique manualmente no painel do Supabase (Authentication → Users) antes de tentar de novo.";
  }
  if (error.status === 401 || error.status === 403 || msg.includes("api key") || msg.includes("apikey") || msg.includes("jwt")) {
    return "Falha de autenticação com o Supabase Admin API — verifique se a variável SUPABASE_SERVICE_ROLE_KEY está correta no ambiente.";
  }
  if (msg.includes("database error")) {
    return `Erro no banco ao criar o usuário (provável conflito de WhatsApp/e-mail já em uso, ou falha no trigger de criação de perfil). Detalhe do Supabase: "${error.message}".`;
  }
  return `Erro do Supabase Auth ao criar o usuário. Detalhe: "${error.message}".`;
}

function missingServiceRoleKeyError(): string | null {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return "Erro de configuração: a variável de ambiente SUPABASE_SERVICE_ROLE_KEY não está definida neste ambiente.";
  }
  return null;
}

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

async function provisionRestaurant(db: Db, ownerId: string, input: ProvisionInput): Promise<ProvisionResult> {
  const { data: slugTaken } = await db.from("restaurants").select("id").eq("slug", input.slug).maybeSingle();
  if (slugTaken) return { error: "Este slug já está em uso." };

  const { data: plan, error: planLookupError } = await db.from("plans").select("code").eq("id", input.planId).maybeSingle();
  if (planLookupError) {
    log("plans lookup failed", planLookupError);
    return { error: `Não foi possível consultar o plano selecionado. Detalhe: "${planLookupError.message}".` };
  }
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
    log("restaurants insert failed", restaurantError);
    if (restaurantError?.code === "23505") return { error: "Este slug já está em uso." };
    return { error: `Não foi possível criar o restaurante. Detalhe do banco: "${restaurantError?.message}".` };
  }

  const { error: membershipError } = await db
    .from("restaurant_users")
    .insert({ restaurant_id: restaurant.id, user_id: ownerId, role: "owner" });
  if (membershipError) {
    log("restaurant_users insert failed", membershipError);
    return { error: `Restaurante criado, mas não foi possível vincular o responsável (restaurant_users). Detalhe: "${membershipError.message}".` };
  }

  const subscriptionStatus = input.accessType === "trial" ? "trial" : "active";
  const { error: subscriptionError } = await db.from("subscriptions").insert({
    restaurant_id: restaurant.id,
    plan: plan.code,
    status: subscriptionStatus,
  });
  if (subscriptionError) {
    // Não é crítico pro funcionamento da loja (nada hoje lê `subscriptions`
    // pra exibir nada) — loga e segue, mas avisa o admin em vez de esconder.
    log("subscriptions insert failed", subscriptionError);
    return { restaurantId: restaurant.id, warning: `Loja criada, mas o registro em "subscriptions" falhou: "${subscriptionError.message}".` };
  }

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

  const configError = missingServiceRoleKeyError();
  if (configError) {
    log("missing SUPABASE_SERVICE_ROLE_KEY", {});
    return { error: configError };
  }

  const parsed = createRestaurantByAdminSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const data = parsed.data;
  const slug = slugifyName(data.slug) || slugifyName(data.name);
  // "Adicionar depois": nunca grava string vazia/placeholder — só dígitos
  // reais ou `null`.
  const whatsapp = data.whatsapp.trim() ? onlyDigits(data.whatsapp) : null;

  const db = createServiceRoleClient();

  const { data: existingByEmail, error: emailLookupError } = await db
    .from("profiles")
    .select("id, role, name")
    .eq("email", data.email)
    .maybeSingle();
  if (emailLookupError) {
    log("profiles email lookup failed", emailLookupError);
    return { error: `Não foi possível verificar e-mails existentes. Detalhe: "${emailLookupError.message}".` };
  }
  if (existingByEmail) {
    return { error: "Este e-mail já possui uma conta no VSFood.", existingProfile: existingByEmail };
  }

  if (whatsapp) {
    const { data: existingByWhatsapp, error: whatsappLookupError } = await db
      .from("profiles")
      .select("id")
      .eq("whatsapp", whatsapp)
      .maybeSingle();
    if (whatsappLookupError) {
      log("profiles whatsapp lookup failed", whatsappLookupError);
      return { error: `Não foi possível verificar o WhatsApp informado. Detalhe: "${whatsappLookupError.message}".` };
    }
    if (existingByWhatsapp) {
      return { error: "Este WhatsApp já está em uso por outra conta no VSFood." };
    }
  }

  let ownerId: string;
  try {
    const { data: created, error: createUserError } = await db.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      app_metadata: { role: "restaurant_owner" },
      user_metadata: { name: data.ownerName, whatsapp },
    });

    if (createUserError || !created.user) {
      log("auth.admin.createUser failed", { email: data.email, error: createUserError });
      return { error: createUserError ? describeAuthError(createUserError) : "O Supabase não retornou um usuário criado." };
    }
    ownerId = created.user.id;
  } catch (err) {
    log("auth.admin.createUser threw", err);
    return { error: `Falha inesperada ao criar o usuário no Supabase Auth. Detalhe: "${err instanceof Error ? err.message : String(err)}".` };
  }

  const result = await provisionRestaurant(db, ownerId, {
    name: data.name,
    slug,
    planId: data.planId,
    accessType: data.accessType,
    trialDays: data.trialDays,
    status: data.status,
  });

  if ("error" in result) {
    try {
      const { error: deleteError } = await db.auth.admin.deleteUser(ownerId);
      if (deleteError) {
        log("rollback deleteUser failed", { ownerId, error: deleteError });
        return { error: `${result.error} — ATENÇÃO: não foi possível reverter o usuário criado (id ${ownerId}). Remova manualmente pelo painel do Supabase.` };
      }
    } catch (err) {
      log("rollback deleteUser threw", { ownerId, err });
      return { error: `${result.error} — ATENÇÃO: não foi possível reverter o usuário criado (id ${ownerId}). Remova manualmente pelo painel do Supabase.` };
    }
    return { error: result.error };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/restaurantes");

  return { name: data.name, slug, ownerEmail: data.email, warning: result.warning };
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
    if (roleError) {
      log("profiles role update failed", roleError);
      return { error: `Não foi possível atualizar o tipo da conta. Detalhe: "${roleError.message}".` };
    }
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

  return { name: data.name, slug, ownerEmail: profile.email ?? "", warning: result.warning };
}
