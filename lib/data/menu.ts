import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Category, Product, ProductOption, ProductOptionGroup } from "@/types/database";

export type MenuOptionGroup = ProductOptionGroup & { options: ProductOption[] };
export type MenuProduct = Product & { optionGroups: MenuOptionGroup[] };
export type MenuCategory = Category & { products: MenuProduct[] };

export async function getMenuData(restaurantId: string): Promise<MenuCategory[]> {
  const supabase = await createClient();

  const [categoriesRes, productsRes] = await Promise.all([
    supabase.from("categories").select("*").eq("restaurant_id", restaurantId).order("order"),
    supabase.from("products").select("*").eq("restaurant_id", restaurantId).order("order"),
  ]);

  const products = productsRes.data ?? [];
  const productIds = products.map((p) => p.id);

  const { data: groups } = productIds.length
    ? await supabase.from("product_option_groups").select("*").in("product_id", productIds).order("order")
    : { data: [] };

  const groupIds = (groups ?? []).map((g) => g.id);
  const { data: options } = groupIds.length
    ? await supabase.from("product_options").select("*").in("group_id", groupIds).order("order")
    : { data: [] };

  const optionsByGroup = new Map<string, ProductOption[]>();
  for (const o of options ?? []) {
    const list = optionsByGroup.get(o.group_id) ?? [];
    list.push(o);
    optionsByGroup.set(o.group_id, list);
  }

  const groupsByProduct = new Map<string, MenuOptionGroup[]>();
  for (const g of groups ?? []) {
    const list = groupsByProduct.get(g.product_id) ?? [];
    list.push({ ...g, options: optionsByGroup.get(g.id) ?? [] });
    groupsByProduct.set(g.product_id, list);
  }

  const productsByCategory = new Map<string, MenuProduct[]>();
  for (const p of products) {
    const key = p.category_id ?? "__none__";
    const list = productsByCategory.get(key) ?? [];
    list.push({ ...p, optionGroups: groupsByProduct.get(p.id) ?? [] });
    productsByCategory.set(key, list);
  }

  return (categoriesRes.data ?? []).map((c) => ({ ...c, products: productsByCategory.get(c.id) ?? [] }));
}
