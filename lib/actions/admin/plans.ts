"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { planSchema, planFeatureSchema, type PlanInput, type PlanFeatureInput } from "@/lib/validations/plan";

type Result = { error?: string };

function revalidatePlans() {
  revalidatePath("/admin/planos");
  revalidatePath("/");
}

function toPlanRow(input: PlanInput) {
  return {
    code: input.code,
    name: input.name,
    description: input.description || null,
    complement_text: input.complementText || null,
    cta_label: input.ctaLabel,
    price_monthly: input.priceMonthly,
    price_yearly: input.priceYearly,
    is_featured: input.isFeatured,
    is_active: input.isActive,
    display_order: input.displayOrder,
  };
}

export async function createPlanAction(input: PlanInput, featureIds: string[]): Promise<Result & { id?: string }> {
  await requireAdmin();
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { data: plan, error } = await supabase.from("plans").insert(toPlanRow(parsed.data)).select("id").single();
  if (error || !plan) {
    if (error?.code === "23505") return { error: "Já existe um plano com este código." };
    return { error: "Não foi possível criar o plano." };
  }

  if (featureIds.length > 0) {
    await supabase.from("plan_feature_links").insert(featureIds.map((feature_id) => ({ plan_id: plan.id, feature_id })));
  }

  revalidatePlans();
  return { id: plan.id };
}

export async function updatePlanAction(id: string, input: PlanInput, featureIds: string[]): Promise<Result> {
  await requireAdmin();
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("plans").update(toPlanRow(parsed.data)).eq("id", id);
  if (error) {
    if (error.code === "23505") return { error: "Já existe um plano com este código." };
    return { error: "Não foi possível salvar o plano." };
  }

  await supabase.from("plan_feature_links").delete().eq("plan_id", id);
  if (featureIds.length > 0) {
    await supabase.from("plan_feature_links").insert(featureIds.map((feature_id) => ({ plan_id: id, feature_id })));
  }

  revalidatePlans();
  revalidatePath(`/admin/planos/${id}`);
  return {};
}

export async function togglePlanActiveAction(id: string, isActive: boolean): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("plans").update({ is_active: isActive }).eq("id", id);
  if (error) return { error: "Não foi possível atualizar o plano." };
  revalidatePlans();
  return {};
}

export async function duplicatePlanAction(id: string): Promise<Result & { id?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: plan } = await supabase.from("plans").select("*").eq("id", id).maybeSingle();
  if (!plan) return { error: "Plano não encontrado." };

  let code = `${plan.code}-copia`;
  let attempt = 1;
  for (;;) {
    const { data: taken } = await supabase.from("plans").select("id").eq("code", code).maybeSingle();
    if (!taken) break;
    attempt += 1;
    code = `${plan.code}-copia-${attempt}`;
  }

  const { data: copy, error } = await supabase
    .from("plans")
    .insert({
      code,
      name: `${plan.name} (cópia)`,
      description: plan.description,
      complement_text: plan.complement_text,
      cta_label: plan.cta_label,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      is_featured: false,
      is_active: false,
      display_order: plan.display_order,
      trial_days_default: plan.trial_days_default,
    })
    .select("id")
    .single();
  if (error || !copy) return { error: "Não foi possível duplicar o plano." };

  const { data: links } = await supabase.from("plan_feature_links").select("feature_id").eq("plan_id", id);
  if (links && links.length > 0) {
    await supabase.from("plan_feature_links").insert(links.map((l) => ({ plan_id: copy.id, feature_id: l.feature_id })));
  }

  revalidatePlans();
  return { id: copy.id };
}

export async function upsertPlanFeatureAction(id: string | null, input: PlanFeatureInput): Promise<Result> {
  await requireAdmin();
  const parsed = planFeatureSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const row = {
    key: parsed.data.key,
    name: parsed.data.name,
    description: parsed.data.description || null,
    is_active: parsed.data.isActive,
    display_order: parsed.data.displayOrder,
  };

  const { error } = id
    ? await supabase.from("plan_features").update(row).eq("id", id)
    : await supabase.from("plan_features").insert(row);

  if (error) {
    if (error.code === "23505") return { error: "Já existe uma funcionalidade com esta chave." };
    return { error: "Não foi possível salvar a funcionalidade." };
  }

  revalidatePath("/admin/planos/funcionalidades");
  revalidatePlans();
  return {};
}

export async function togglePlanFeatureActiveAction(id: string, isActive: boolean): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("plan_features").update({ is_active: isActive }).eq("id", id);
  if (error) return { error: "Não foi possível atualizar a funcionalidade." };
  revalidatePath("/admin/planos/funcionalidades");
  revalidatePlans();
  return {};
}
