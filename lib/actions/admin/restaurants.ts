"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { onlyDigits } from "@/lib/format";
import type { AccessType, RestaurantStatus } from "@/types/database";

type Result = { error?: string };

function revalidateAdmin(id?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/restaurantes");
  if (id) revalidatePath(`/admin/restaurantes/${id}`);
}

export async function updateRestaurantStatusAction(id: string, status: RestaurantStatus): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("restaurants").update({ status }).eq("id", id);
  if (error) return { error: "Não foi possível atualizar o status." };
  revalidateAdmin(id);
  return {};
}

const slugField = z
  .string()
  .trim()
  .min(2, "Informe o slug")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífen");

export async function updateRestaurantSlugAction(id: string, newSlug: string): Promise<Result> {
  await requireAdmin();
  const parsed = slugField.safeParse(newSlug);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Slug inválido." };

  const supabase = await createClient();
  const { data: current } = await supabase.from("restaurants").select("slug").eq("id", id).maybeSingle();

  const { error } = await supabase.from("restaurants").update({ slug: parsed.data }).eq("id", id);
  if (error) {
    if (error.code === "23505") return { error: "Este slug já está em uso por outra loja." };
    return { error: "Não foi possível alterar o slug." };
  }

  if (current?.slug) revalidatePath(`/loja/${current.slug}`);
  revalidatePath(`/loja/${parsed.data}`);
  revalidateAdmin(id);
  return {};
}

export async function updateRestaurantPlanAction(id: string, planId: string): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: plan } = await supabase.from("plans").select("code").eq("id", planId).maybeSingle();
  if (!plan) return { error: "Plano não encontrado." };

  const { error } = await supabase.from("restaurants").update({ plan_id: planId, plan: plan.code }).eq("id", id);
  if (error) return { error: "Não foi possível atualizar o plano." };
  revalidateAdmin(id);
  return {};
}

export async function setAccessTypeAction(id: string, accessType: AccessType): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();

  if (accessType === "demo") {
    const { error } = await supabase
      .from("restaurants")
      .update({ access_type: "demo", is_demo: true, status: "active" })
      .eq("id", id);
    if (error) return { error: "Não foi possível marcar a loja como demonstração." };
    revalidateAdmin(id);
    return {};
  }

  if (accessType === "trial") {
    const now = new Date();
    const expires = new Date(now);
    expires.setDate(expires.getDate() + 7);
    const { error } = await supabase
      .from("restaurants")
      .update({
        access_type: "trial",
        is_demo: false,
        status: "trial",
        trial_started_at: now.toISOString(),
        trial_expires_at: expires.toISOString(),
      })
      .eq("id", id);
    if (error) return { error: "Não foi possível transformar em teste grátis." };
    revalidateAdmin(id);
    return {};
  }

  const { error } = await supabase
    .from("restaurants")
    .update({ access_type: "subscriber", is_demo: false, status: "active" })
    .eq("id", id);
  if (error) return { error: "Não foi possível transformar em assinante." };
  revalidateAdmin(id);
  return {};
}

export async function toggleDemoAction(id: string, isDemo: boolean): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();

  const update = isDemo
    ? { is_demo: true, access_type: "demo" as AccessType, status: "active" as RestaurantStatus }
    : { is_demo: false, access_type: "subscriber" as AccessType };

  const { error } = await supabase.from("restaurants").update(update).eq("id", id);
  if (error) return { error: "Não foi possível atualizar a demonstração." };
  revalidateAdmin(id);
  return {};
}

export async function extendTrialAction(id: string, days: number): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: restaurant } = await supabase.from("restaurants").select("trial_expires_at").eq("id", id).maybeSingle();
  if (!restaurant) return { error: "Loja não encontrada." };

  const base = new Date(Math.max(new Date(restaurant.trial_expires_at).getTime(), Date.now()));
  base.setDate(base.getDate() + days);

  const { error } = await supabase
    .from("restaurants")
    .update({ trial_expires_at: base.toISOString(), status: "trial" })
    .eq("id", id);
  if (error) return { error: "Não foi possível estender o teste." };
  revalidateAdmin(id);
  return {};
}

export async function setTrialExpiryAction(id: string, isoDate: string): Promise<Result> {
  await requireAdmin();
  const parsed = z.string().datetime().safeParse(new Date(isoDate).toISOString());
  if (!parsed.success) return { error: "Data inválida." };

  const supabase = await createClient();
  const { error } = await supabase.from("restaurants").update({ trial_expires_at: parsed.data }).eq("id", id);
  if (error) return { error: "Não foi possível alterar o vencimento." };
  revalidateAdmin(id);
  return {};
}

export async function updateOwnerEmailAction(ownerId: string, restaurantId: string, newEmail: string): Promise<Result> {
  await requireAdmin();
  const parsed = z.string().trim().email("E-mail inválido").safeParse(newEmail);
  if (!parsed.success) return { error: "E-mail inválido." };

  const db = createServiceRoleClient();
  const { error: authError } = await db.auth.admin.updateUserById(ownerId, { email: parsed.data });
  if (authError) return { error: "Não foi possível alterar o e-mail de acesso." };

  await db.from("profiles").update({ email: parsed.data }).eq("id", ownerId);
  revalidateAdmin(restaurantId);
  return {};
}

/**
 * Aceita string vazia pra "remover" o WhatsApp (grava `null` — nunca string
 * vazia/placeholder). O responsável pode não ter WhatsApp cadastrado ainda
 * (ex: loja criada pelo DEV antes de receber o contato definitivo do dono).
 */
export async function updateOwnerWhatsappAction(ownerId: string, restaurantId: string, newWhatsapp: string): Promise<Result> {
  await requireAdmin();
  const trimmed = newWhatsapp.trim();
  const digits = trimmed ? onlyDigits(trimmed) : null;
  if (digits && (digits.length < 10 || digits.length > 11)) {
    return { error: "WhatsApp inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ whatsapp: digits }).eq("id", ownerId);
  if (error) {
    if (error.code === "23505") return { error: "Este WhatsApp já está em uso por outra conta." };
    return { error: "Não foi possível alterar o WhatsApp." };
  }

  revalidateAdmin(restaurantId);
  return {};
}

export async function resetOwnerAccessAction(ownerEmail: string): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(ownerEmail, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback?next=/recuperar-senha/redefinir`,
  });
  return {};
}

export async function deleteRestaurantAction(id: string): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("restaurants").delete().eq("id", id);
  if (error) {
    return {
      error: "Não foi possível excluir: esta loja possui pedidos registrados. Suspenda a loja em vez de excluir.",
    };
  }
  revalidateAdmin();
  return {};
}
