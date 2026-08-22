import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getOpenStatus } from "@/lib/opening-hours";
import type { Restaurant } from "@/types/database";

export type MarketplaceRestaurant = Restaurant & {
  isOpen: boolean;
  minDeliveryFee: number | null;
};

export async function getMarketplaceRestaurants(): Promise<MarketplaceRestaurant[]> {
  const supabase = await createClient();

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("*")
    .neq("status", "suspended")
    .order("name");

  if (!restaurants || restaurants.length === 0) return [];

  const ids = restaurants.map((r) => r.id);
  const [hoursRes, zonesRes] = await Promise.all([
    supabase.from("opening_hours").select("*").in("restaurant_id", ids),
    supabase.from("delivery_zones").select("*").in("restaurant_id", ids).eq("active", true),
  ]);

  const hoursByRestaurant = new Map<string, typeof hoursRes.data>();
  for (const h of hoursRes.data ?? []) {
    const list = hoursByRestaurant.get(h.restaurant_id) ?? [];
    list.push(h);
    hoursByRestaurant.set(h.restaurant_id, list);
  }

  const feesByRestaurant = new Map<string, number[]>();
  for (const z of zonesRes.data ?? []) {
    const list = feesByRestaurant.get(z.restaurant_id) ?? [];
    list.push(z.fee);
    feesByRestaurant.set(z.restaurant_id, list);
  }

  return restaurants.map((r) => {
    const hours = hoursByRestaurant.get(r.id) ?? [];
    const fees = feesByRestaurant.get(r.id) ?? [];
    return {
      ...r,
      isOpen: getOpenStatus(hours).isOpen && !r.orders_paused,
      minDeliveryFee: fees.length > 0 ? Math.min(...fees) : null,
    };
  });
}
