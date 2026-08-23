import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Plan, PlanFeature } from "@/types/database";

export type MarketingPlan = Plan & { features: PlanFeature[] };

export async function getActivePlansWithFeatures(): Promise<MarketingPlan[]> {
  const supabase = await createClient();

  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("display_order");
  if (!plans || plans.length === 0) return [];

  const ids = plans.map((p) => p.id);
  const [{ data: links }, { data: features }] = await Promise.all([
    supabase.from("plan_feature_links").select("plan_id, feature_id").in("plan_id", ids),
    supabase.from("plan_features").select("*").eq("is_active", true).order("display_order"),
  ]);

  const featureById = new Map((features ?? []).map((f) => [f.id, f]));
  const featuresByPlan = new Map<string, PlanFeature[]>();
  for (const l of links ?? []) {
    const feature = featureById.get(l.feature_id);
    if (!feature) continue;
    const list = featuresByPlan.get(l.plan_id) ?? [];
    list.push(feature);
    featuresByPlan.set(l.plan_id, list);
  }

  return plans.map((p) => ({ ...p, features: featuresByPlan.get(p.id) ?? [] }));
}

export type DemoRestaurant = { slug: string; name: string };

export async function getDemoRestaurant(): Promise<DemoRestaurant | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurants")
    .select("slug, name")
    .eq("is_demo", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data;
}
