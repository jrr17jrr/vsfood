"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { RestaurantStatus } from "@/types/database";

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

export async function updateRestaurantPlanAction(id: string, plan: string): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("restaurants").update({ plan }).eq("id", id);
  if (error) return { error: "Não foi possível atualizar o plano." };
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
