import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateGroupCharges } from "@/lib/pricing/option-groups";
import { roundCurrency } from "@/lib/orders/pricing";
import type { Database, Product } from "@/types/database";

export type ResolvedOrderItem = {
  productId: string;
  categoryId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  notes: string;
  subtotal: number;
  options: { groupName: string; optionName: string; price: number }[];
};

export type CartItemInput = {
  productId: string;
  quantity: number;
  notes?: string;
  optionIds: { groupId: string; optionId: string }[];
};

export type ResolveItemsResult =
  | { resolvedItems: ResolvedOrderItem[]; subtotal: number; productMap: Map<string, Product> }
  | { error: string };

/**
 * Valida itens do carrinho e recalcula preços a partir do banco — nunca
 * confia no preço/adicional que o client mandou. Usado por createOrderAction
 * (fonte da verdade) e pelo preview de cupom no checkout (mesma regra, sem
 * gravar nada).
 */
export async function resolveOrderItems(
  db: SupabaseClient<Database>,
  restaurantId: string,
  items: CartItemInput[],
): Promise<ResolveItemsResult> {
  const productIds = [...new Set(items.map((i) => i.productId))];
  const { data: products } = await db.from("products").select("*").eq("restaurant_id", restaurantId).in("id", productIds);
  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  const { data: groups } = await db.from("product_option_groups").select("*").in("product_id", productIds);
  const groupMap = new Map((groups ?? []).map((g) => [g.id, g]));

  const groupIds = (groups ?? []).map((g) => g.id);
  const { data: options } = groupIds.length
    ? await db.from("product_options").select("*").in("group_id", groupIds)
    : { data: [] };
  const optionMap = new Map((options ?? []).map((o) => [o.id, o]));

  const resolvedItems: ResolvedOrderItem[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product || !product.available) return { error: "Um dos produtos não está mais disponível." };

    const productGroups = (groups ?? []).filter((g) => g.product_id === product.id);
    const selectedByGroup = new Map<string, string[]>();
    for (const sel of item.optionIds) {
      const group = groupMap.get(sel.groupId);
      const option = optionMap.get(sel.optionId);
      if (!group || group.product_id !== product.id) return { error: "Adicional inválido." };
      if (!option || option.group_id !== group.id || !option.available) {
        return { error: "Um dos adicionais não está mais disponível." };
      }
      const list = selectedByGroup.get(group.id) ?? [];
      list.push(option.id);
      selectedByGroup.set(group.id, list);
    }

    for (const group of productGroups) {
      const count = (selectedByGroup.get(group.id) ?? []).length;
      if (group.required && count < Math.max(group.min_select, 1)) {
        return { error: `Selecione uma opção em "${group.name}" (${product.name}).` };
      }
      if (count < group.min_select) {
        return { error: `Selecione ao menos ${group.min_select} opções em "${group.name}" (${product.name}).` };
      }
      if (count > group.max_select) {
        return { error: `Selecione no máximo ${group.max_select} opções em "${group.name}" (${product.name}).` };
      }
    }

    const basePrice = product.promo_price ?? product.price;

    const resolvedOptions = productGroups.flatMap((group) => {
      const selectedIds = selectedByGroup.get(group.id) ?? [];
      const selectedOpts = selectedIds.map((id) => {
        const option = optionMap.get(id)!;
        return { id: option.id, price: option.price };
      });
      const charges = calculateGroupCharges(
        { id: group.id, pricingMode: group.pricing_mode, freeQuantity: group.free_quantity, fixedPrice: group.fixed_price },
        selectedOpts,
      );
      return charges.map((c) => {
        const option = optionMap.get(c.optionId)!;
        return { groupName: group.name, optionName: option.name, price: c.charge };
      });
    });
    const optionsTotal = resolvedOptions.reduce((sum, o) => sum + o.price, 0);
    const lineSubtotal = roundCurrency((basePrice + optionsTotal) * item.quantity);

    resolvedItems.push({
      productId: product.id,
      categoryId: product.category_id,
      name: product.name,
      unitPrice: basePrice,
      quantity: item.quantity,
      notes: item.notes ?? "",
      subtotal: lineSubtotal,
      options: resolvedOptions,
    });
  }

  const subtotal = roundCurrency(resolvedItems.reduce((sum, i) => sum + i.subtotal, 0));
  return { resolvedItems, subtotal, productMap };
}
