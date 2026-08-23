import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Plan, PlanFeature } from "@/types/database";

export type AdminPlanListItem = Plan & { restaurant_count: number; feature_names: string[] };

export async function getAdminPlans(): Promise<AdminPlanListItem[]> {
  const supabase = await createClient();

  const { data: plans } = await supabase.from("plans").select("*").order("display_order");
  if (!plans || plans.length === 0) return [];

  const ids = plans.map((p) => p.id);
  const [{ data: restaurants }, { data: links }, { data: features }] = await Promise.all([
    supabase.from("restaurants").select("plan_id").in("plan_id", ids),
    supabase.from("plan_feature_links").select("plan_id, feature_id").in("plan_id", ids),
    supabase.from("plan_features").select("id, name"),
  ]);

  const countByPlan = new Map<string, number>();
  for (const r of restaurants ?? []) {
    if (!r.plan_id) continue;
    countByPlan.set(r.plan_id, (countByPlan.get(r.plan_id) ?? 0) + 1);
  }

  const featureNameById = new Map((features ?? []).map((f) => [f.id, f.name]));
  const featureNamesByPlan = new Map<string, string[]>();
  for (const l of links ?? []) {
    const name = featureNameById.get(l.feature_id);
    if (!name) continue;
    const list = featureNamesByPlan.get(l.plan_id) ?? [];
    list.push(name);
    featureNamesByPlan.set(l.plan_id, list);
  }

  return plans.map((p) => ({
    ...p,
    restaurant_count: countByPlan.get(p.id) ?? 0,
    feature_names: featureNamesByPlan.get(p.id) ?? [],
  }));
}

export type PlanDetail = Plan & { feature_ids: string[] };

export async function getPlanDetail(id: string): Promise<PlanDetail | null> {
  const supabase = await createClient();
  const { data: plan } = await supabase.from("plans").select("*").eq("id", id).maybeSingle();
  if (!plan) return null;

  const { data: links } = await supabase.from("plan_feature_links").select("feature_id").eq("plan_id", id);

  return { ...plan, feature_ids: (links ?? []).map((l) => l.feature_id) };
}

export async function getAllPlanFeatures(): Promise<PlanFeature[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("plan_features").select("*").order("display_order");
  return data ?? [];
}

export type ActivePlanOption = { id: string; name: string; trial_days_default: number };

export async function getActivePlansForForm(): Promise<ActivePlanOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("plans")
    .select("id, name, trial_days_default")
    .eq("is_active", true)
    .order("display_order");
  return data ?? [];
}
