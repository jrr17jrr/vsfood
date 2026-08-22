import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Category, DeliveryZone, OpeningHour, Product, ProductOption, ProductOptionGroup, Restaurant } from "@/types/database";

export type StorefrontOption = ProductOption;
export type StorefrontOptionGroup = ProductOptionGroup & { options: StorefrontOption[] };
export type StorefrontProduct = Product & { optionGroups: StorefrontOptionGroup[] };
export type StorefrontCategory = Category & { products: StorefrontProduct[] };

export type StorefrontData = {
  restaurant: Restaurant;
  categories: StorefrontCategory[];
  openingHours: OpeningHour[];
  deliveryZones: DeliveryZone[];
};

export async function getStorefrontData(slug: string): Promise<StorefrontData | null> {
  const supabase = await createClient();

  const { data: restaurant, error } = await supabase.from("restaurants").select("*").eq("slug", slug).maybeSingle();
  if (error || !restaurant) return null;

  const [categoriesRes, productsRes, groupsRes, optionsRes, hoursRes, zonesRes] = await Promise.all([
    supabase.from("categories").select("*").eq("restaurant_id", restaurant.id).order("order"),
    supabase.from("products").select("*").eq("restaurant_id", restaurant.id).order("order"),
    supabase.from("product_option_groups").select("*").order("order"),
    supabase.from("product_options").select("*").order("order"),
    supabase.from("opening_hours").select("*").eq("restaurant_id", restaurant.id),
    supabase.from("delivery_zones").select("*").eq("restaurant_id", restaurant.id).eq("active", true),
  ]);

  const products = productsRes.data ?? [];
  const productIds = new Set(products.map((p) => p.id));

  const groups = (groupsRes.data ?? []).filter((g) => productIds.has(g.product_id));
  const groupIds = new Set(groups.map((g) => g.id));

  const options = (optionsRes.data ?? []).filter((o) => o.available && groupIds.has(o.group_id));

  const optionsByGroup = new Map<string, StorefrontOption[]>();
  for (const opt of options) {
    const list = optionsByGroup.get(opt.group_id) ?? [];
    list.push(opt);
    optionsByGroup.set(opt.group_id, list);
  }

  const groupsByProduct = new Map<string, StorefrontOptionGroup[]>();
  for (const g of groups) {
    const list = groupsByProduct.get(g.product_id) ?? [];
    list.push({ ...g, options: optionsByGroup.get(g.id) ?? [] });
    groupsByProduct.set(g.product_id, list);
  }

  const productsByCategory = new Map<string, StorefrontProduct[]>();
  for (const p of products) {
    const key = p.category_id ?? "__none__";
    const list = productsByCategory.get(key) ?? [];
    list.push({ ...p, optionGroups: groupsByProduct.get(p.id) ?? [] });
    productsByCategory.set(key, list);
  }

  const categories: StorefrontCategory[] = (categoriesRes.data ?? [])
    .map((c) => ({ ...c, products: productsByCategory.get(c.id) ?? [] }))
    .filter((c) => c.products.length > 0);

  return {
    restaurant,
    categories,
    openingHours: hoursRes.data ?? [],
    deliveryZones: zonesRes.data ?? [],
  };
}
