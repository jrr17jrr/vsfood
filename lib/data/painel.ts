import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Order, Restaurant } from "@/types/database";

/**
 * `cache()` dedupe por request: tanto app/painel/layout.tsx quanto a page.tsx
 * de várias rotas (aparência, dashboard) buscam o mesmo restaurante — sem
 * isso, uma carga direta/hard refresh de /painel/aparencia disparava a mesma
 * query duas vezes no mesmo request. Escopo é só dentro de UM request, nunca
 * atravessa navegações nem usuários.
 */
export const getRestaurant = cache(async (restaurantId: string): Promise<Restaurant | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("restaurants").select("*").eq("id", restaurantId).maybeSingle();
  return data;
});

export const getPlanName = cache(async (planId: string | null): Promise<string | null> => {
  if (!planId) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select("name").eq("id", planId).maybeSingle();
  return data?.name ?? null;
});

export type DashboardStats = {
  ordersToday: number;
  revenueToday: number;
  averageTicket: number;
  pendingOrders: number;
  totalOrders: number;
};

function startOfTodaySaoPaulo(): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return new Date(`${y}-${m}-${d}T00:00:00-03:00`);
}

export async function getDashboardStats(restaurantId: string): Promise<DashboardStats> {
  const supabase = await createClient();
  const todayStart = startOfTodaySaoPaulo().toISOString();

  const [{ data: todayOrders }, { count: pendingCount }, { count: totalCount }] = await Promise.all([
    supabase
      .from("orders")
      .select("total, payment_status")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", todayStart)
      .not("status", "in", "(rejected,cancelled)"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .eq("status", "new"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId),
  ]);

  const orders = todayOrders ?? [];
  const revenueToday = orders.reduce((sum, o) => sum + o.total, 0);

  return {
    ordersToday: orders.length,
    revenueToday,
    averageTicket: orders.length > 0 ? revenueToday / orders.length : 0,
    pendingOrders: pendingCount ?? 0,
    totalOrders: totalCount ?? 0,
  };
}

export type PainelOrder = Order & { customer_name: string; customer_whatsapp: string | null };

export async function getPainelOrders(restaurantId: string, limit = 100): Promise<PainelOrder[]> {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!orders || orders.length === 0) return [];

  const customerIds = [...new Set(orders.map((o) => o.customer_id))];
  const { data: profiles } = await supabase.from("profiles").select("id, name, whatsapp").in("id", customerIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return orders.map((o) => {
    const customer = profileMap.get(o.customer_id);
    return { ...o, customer_name: customer?.name ?? "Cliente", customer_whatsapp: customer?.whatsapp ?? null };
  });
}
