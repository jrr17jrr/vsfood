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
  totalOrders: number;
  mrrEstimate: number;
};

const BASIC_PLAN_PRICE = 69.9;

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = await createClient();

  const [{ data: restaurants }, { count: totalOrders }] = await Promise.all([
    supabase.from("restaurants").select("status, trial_expires_at, plan"),
    supabase.from("orders").select("id", { count: "exact", head: true }),
  ]);

  const list = restaurants ?? [];
  let active = 0;
  let trial = 0;
  let trialExpired = 0;
  let suspended = 0;

  for (const r of list) {
    const effective = getEffectiveStatus(r);
    if (effective === "active") active++;
    else if (effective === "trial") trial++;
    else if (effective === "trial_expired") trialExpired++;
    else if (effective === "suspended") suspended++;
  }

  return {
    total: list.length,
    active,
    trial,
    trialExpired,
    suspended,
    totalOrders: totalOrders ?? 0,
    mrrEstimate: active * BASIC_PLAN_PRICE,
  };
}

export type AdminRestaurantListItem = Restaurant & {
  owner_name: string | null;
  owner_email: string | null;
  order_count: number;
};

export async function getAdminRestaurants(): Promise<AdminRestaurantListItem[]> {
  const supabase = await createClient();

  const { data: restaurants } = await supabase.from("restaurants").select("*").order("created_at", { ascending: false });
  if (!restaurants || restaurants.length === 0) return [];

  const ids = restaurants.map((r) => r.id);

  const [{ data: memberships }, { data: orderCounts }] = await Promise.all([
    supabase.from("restaurant_users").select("restaurant_id, user_id").in("restaurant_id", ids).eq("role", "owner"),
    supabase.from("orders").select("restaurant_id").in("restaurant_id", ids),
  ]);

  const ownerIds = [...new Set((memberships ?? []).map((m) => m.user_id))];
  const { data: owners } = ownerIds.length
    ? await supabase.from("profiles").select("id, name, email").in("id", ownerIds)
    : { data: [] };
  const ownerByRestaurant = new Map((memberships ?? []).map((m) => [m.restaurant_id, m.user_id]));
  const ownerProfileMap = new Map((owners ?? []).map((o) => [o.id, o]));

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
    };
  });
}

export type AdminRestaurantDetail = AdminRestaurantListItem & {
  owner_id: string | null;
  revenue_total: number;
};

export async function getAdminRestaurantDetail(id: string): Promise<AdminRestaurantDetail | null> {
  const supabase = await createClient();

  const { data: restaurant } = await supabase.from("restaurants").select("*").eq("id", id).maybeSingle();
  if (!restaurant) return null;

  const { data: membership } = await supabase
    .from("restaurant_users")
    .select("user_id")
    .eq("restaurant_id", id)
    .eq("role", "owner")
    .maybeSingle();

  const { data: owner } = membership
    ? await supabase.from("profiles").select("id, name, email").eq("id", membership.user_id).maybeSingle()
    : { data: null };

  const { data: orders } = await supabase.from("orders").select("total").eq("restaurant_id", id);

  return {
    ...restaurant,
    owner_id: owner?.id ?? null,
    owner_name: owner?.name ?? null,
    owner_email: owner?.email ?? null,
    order_count: orders?.length ?? 0,
    revenue_total: (orders ?? []).reduce((s, o) => s + o.total, 0),
  };
}
