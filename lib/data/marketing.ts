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

export type DemoRestaurant = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cuisine_type: string | null;
  logo_url: string | null;
  banner_url: string | null;
};

/**
 * Busca a loja marcada como `is_demo` no banco (a mais antiga, se houver mais
 * de uma) — nunca por nome. Se nenhuma loja estiver marcada como demo, a home
 * simplesmente não mostra a seção (ver DemoSection), sem link quebrado.
 */
export async function getDemoRestaurant(): Promise<DemoRestaurant | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurants")
    .select("id, slug, name, description, cuisine_type, logo_url, banner_url")
    .eq("is_demo", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data;
}

export type DemoPreviewProduct = { name: string; price: number; image_url: string | null };

/**
 * Um punhado de produtos reais da loja demo (nome, preço, foto) só pra
 * ilustrar o mockup do Hero — consulta leve, não a storefront completa
 * (categorias, grupos de opção etc.) que a página /loja/[slug] precisa.
 */
export async function getDemoPreviewProducts(restaurantId: string, limit = 2): Promise<DemoPreviewProduct[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("name, price, image_url")
    .eq("restaurant_id", restaurantId)
    .eq("available", true)
    .order("order")
    .limit(limit);
  return data ?? [];
}

export type DemoCategory = { name: string };

/** Um par de categorias reais da loja demo, só pros chips do mockup do Hero. */
export async function getDemoCategories(restaurantId: string, limit = 3): Promise<DemoCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("name")
    .eq("restaurant_id", restaurantId)
    .eq("active", true)
    .order("order")
    .limit(limit);
  return data ?? [];
}
