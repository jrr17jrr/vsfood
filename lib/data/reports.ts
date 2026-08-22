import "server-only";

import { createClient } from "@/lib/supabase/server";

function daysAgoSaoPaulo(days: number): string {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() - days);
  return now.toISOString();
}

export type ReportStats = {
  ordersToday: number;
  ordersWeek: number;
  ordersMonth: number;
  revenueToday: number;
  revenueMonth: number;
  averageTicketMonth: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
};

export async function getReportStats(restaurantId: string): Promise<ReportStats> {
  const supabase = await createClient();

  const todayStart = daysAgoSaoPaulo(1);
  const weekStart = daysAgoSaoPaulo(7);
  const monthStart = daysAgoSaoPaulo(30);

  const { data: monthOrders } = await supabase
    .from("orders")
    .select("id, total, created_at")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", monthStart)
    .not("status", "in", "(rejected,cancelled)");

  const orders = monthOrders ?? [];
  const ordersToday = orders.filter((o) => o.created_at >= todayStart).length;
  const ordersWeek = orders.filter((o) => o.created_at >= weekStart).length;
  const revenueToday = orders.filter((o) => o.created_at >= todayStart).reduce((s, o) => s + o.total, 0);
  const revenueMonth = orders.reduce((s, o) => s + o.total, 0);

  const orderIds = orders.map((o) => o.id);
  const { data: items } = orderIds.length
    ? await supabase.from("order_items").select("name_snapshot, quantity, subtotal").in("order_id", orderIds)
    : { data: [] };

  const byProduct = new Map<string, { quantity: number; revenue: number }>();
  for (const item of items ?? []) {
    const current = byProduct.get(item.name_snapshot) ?? { quantity: 0, revenue: 0 };
    current.quantity += item.quantity;
    current.revenue += item.subtotal;
    byProduct.set(item.name_snapshot, current);
  }

  const topProducts = Array.from(byProduct.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return {
    ordersToday,
    ordersWeek,
    ordersMonth: orders.length,
    revenueToday,
    revenueMonth,
    averageTicketMonth: orders.length > 0 ? revenueMonth / orders.length : 0,
    topProducts,
  };
}
