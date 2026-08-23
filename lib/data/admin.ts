import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Restaurant } from "@/types/database";
import { getEffectiveStatus } from "@/lib/admin-status";

export type AdminDashboardStats = {
  total: number;
  active: number;
  trial: number;
  trialExpired: number;
  suspended: number;
  demo: number;
  newLast30Days: number;
  trialEndingSoon: number;
  totalOrders: number;
  mrr: number;
  subscribersByPlan: { planName: string; count: number }[];
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = await createClient();

  const [{ data: restaurants }, { count: totalOrders }, { data: plans }] = await Promise.all([
    supabase.from("restaurants").select("status, trial_expires_at, plan_id, access_type, is_demo, created_at"),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("plans").select("id, name, price_monthly"),
  ]);

  const list = restaurants ?? [];
  const planById = new Map((plans ?? []).map((p) => [p.id, p]));
  const thirtyDaysAgo = Date.now() - 30 * 86_400_000;
  const threeDaysFromNow = Date.now() + 3 * 86_400_000;

  let active = 0;
  let trial = 0;
  let trialExpired = 0;
  let suspended = 0;
  let demo = 0;
  let newLast30Days = 0;
  let trialEndingSoon = 0;
  let mrr = 0;
  const subscriberCountByPlan = new Map<string, number>();

  for (const r of list) {
    if (r.is_demo) demo++;
    if (new Date(r.created_at).getTime() >= thirtyDaysAgo) newLast30Days++;

    const effective = getEffectiveStatus(r);
    if (!r.is_demo) {
      if (effective === "active") active++;
      else if (effective === "trial") trial++;
      else if (effective === "trial_expired") trialExpired++;
      else if (effective === "suspended") suspended++;
    }

    if (
      !r.is_demo &&
      r.access_type === "trial" &&
      effective === "trial" &&
      new Date(r.trial_expires_at).getTime() <= threeDaysFromNow
    ) {
      trialEndingSoon++;
    }

    if (!r.is_demo && r.access_type === "subscriber" && r.status === "active") {
      const plan = r.plan_id ? planById.get(r.plan_id) : undefined;
      if (plan?.price_monthly) mrr += Number(plan.price_monthly);
      const planName = plan?.name ?? "Sem plano";
      subscriberCountByPlan.set(planName, (subscriberCountByPlan.get(planName) ?? 0) + 1);
    }
  }

  return {
    total: list.length,
    active,
    trial,
    trialExpired,
    suspended,
    demo,
    newLast30Days,
    trialEndingSoon,
    totalOrders: totalOrders ?? 0,
    mrr,
    subscribersByPlan: [...subscriberCountByPlan.entries()].map(([planName, count]) => ({ planName, count })),
  };
}

export type AdminRestaurantListItem = Restaurant & {
  owner_name: string | null;
  owner_email: string | null;
  order_count: number;
  plan_name: string | null;
};

async function attachOwnersAndCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  restaurants: Restaurant[],
): Promise<AdminRestaurantListItem[]> {
  const ids = restaurants.map((r) => r.id);
  const planIds = [...new Set(restaurants.map((r) => r.plan_id).filter((id): id is string => !!id))];

  const [{ data: memberships }, { data: orderCounts }, { data: plans }] = await Promise.all([
    supabase.from("restaurant_users").select("restaurant_id, user_id").in("restaurant_id", ids).eq("role", "owner"),
    supabase.from("orders").select("restaurant_id").in("restaurant_id", ids),
    planIds.length ? supabase.from("plans").select("id, name").in("id", planIds) : Promise.resolve({ data: [] }),
  ]);

  const ownerIds = [...new Set((memberships ?? []).map((m) => m.user_id))];
  const { data: owners } = ownerIds.length
    ? await supabase.from("profiles").select("id, name, email").in("id", ownerIds)
    : { data: [] };
  const ownerByRestaurant = new Map((memberships ?? []).map((m) => [m.restaurant_id, m.user_id]));
  const ownerProfileMap = new Map((owners ?? []).map((o) => [o.id, o]));
  const planNameById = new Map((plans ?? []).map((p) => [p.id, p.name]));

  const countByRestaurant = new Map<string, number>();
  for (const o of orderCounts ?? []) {
    countByRestaurant.set(o.restaurant_id, (countByRestaurant.get(o.restaurant_id) ?? 0) + 1);
  }

  return restaurants.map((r) => {
    const ownerId = ownerByRestaurant.get(r.id);
    const owner = ownerId ? ownerProfileMap.get(ownerId) : undefined;
    return {
      ...r,
      owner_name: owner?.name ?? null,
      owner_email: owner?.email ?? null,
      order_count: countByRestaurant.get(r.id) ?? 0,
      plan_name: r.plan_id ? (planNameById.get(r.plan_id) ?? null) : null,
    };
  });
}

export async function getAdminRestaurants(): Promise<AdminRestaurantListItem[]> {
  const supabase = await createClient();

  const { data: restaurants } = await supabase.from("restaurants").select("*").order("created_at", { ascending: false });
  if (!restaurants || restaurants.length === 0) return [];

  return attachOwnersAndCounts(supabase, restaurants);
}

export type AdminRestaurantDetail = AdminRestaurantListItem & {
  owner_id: string | null;
  revenue_total: number;
};

export async function getAdminRestaurantDetail(id: string): Promise<AdminRestaurantDetail | null> {
  const supabase = await createClient();

  const { data: restaurant } = await supabase.from("restaurants").select("*").eq("id", id).maybeSingle();
  if (!restaurant) return null;

  const [[listItem], { data: membership }, { data: orders }] = await Promise.all([
    attachOwnersAndCounts(supabase, [restaurant]),
    supabase.from("restaurant_users").select("user_id").eq("restaurant_id", id).eq("role", "owner").maybeSingle(),
    supabase.from("orders").select("total").eq("restaurant_id", id),
  ]);

  return {
    ...listItem,
    owner_id: membership?.user_id ?? null,
    revenue_total: (orders ?? []).reduce((s, o) => s + o.total, 0),
  };
}
