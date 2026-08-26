import "server-only";

import type { Coupon } from "@/types/database";

/** Frete grátis: `threshold` null/undefined = sem regra. Retorna a taxa final (0 quando o subtotal bate o limite). */
export function applyFreeShipping(fee: number, subtotal: number, threshold: number | null | undefined): number {
  if (threshold != null && subtotal >= threshold) return 0;
  return fee;
}

export type CouponEligibleItem = { productId: string; categoryId: string | null; subtotal: number };

export type CouponContext = {
  /** Subtotal completo do carrinho — usado pro pedido mínimo do cupom. */
  subtotal: number;
  items: CouponEligibleItem[];
  deliveryType: "delivery" | "pickup";
  /** Já calculado pelo chamador (primeiro pedido do cliente NESTE restaurante). */
  isFirstPurchase: boolean;
  /** Quantas vezes esse cliente já usou este cupom (coupon_usages). */
  usedByCustomerCount: number;
  /** null quando `applies_to_all_products` é true (nenhuma restrição). */
  eligibleProductIds: Set<string> | null;
  eligibleCategoryIds: Set<string> | null;
};

export type CouponEvaluation = { discount: number; freeShipping: boolean } | { error: string };

/**
 * Cupom de "frete grátis" não desconta do subtotal — zera a taxa de entrega
 * (quem chama aplica `freeShipping` na taxa já calculada, fora daqui).
 */
export function evaluateCoupon(coupon: Coupon | null, ctx: CouponContext): CouponEvaluation {
  if (!coupon) return { error: "Cupom não encontrado." };
  if (!coupon.active) return { error: "Este cupom não está mais ativo." };

  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) return { error: "Este cupom ainda não é válido." };
  if (coupon.ends_at && new Date(coupon.ends_at) < now) return { error: "Este cupom expirou." };
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    return { error: "Este cupom atingiu o limite de usos." };
  }
  if (coupon.usage_limit_per_customer !== null && ctx.usedByCustomerCount >= coupon.usage_limit_per_customer) {
    return { error: "Você já usou este cupom o máximo de vezes permitido." };
  }
  if (ctx.subtotal < coupon.min_order_value) {
    return { error: `Pedido mínimo para este cupom: R$ ${coupon.min_order_value.toFixed(2)}.` };
  }
  if (ctx.deliveryType === "delivery" && !coupon.applies_to_delivery) {
    return { error: "Este cupom não é válido para entrega." };
  }
  if (ctx.deliveryType === "pickup" && !coupon.applies_to_pickup) {
    return { error: "Este cupom não é válido para retirada." };
  }
  if (coupon.first_purchase_only && !ctx.isFirstPurchase) {
    return { error: "Este cupom é válido apenas na primeira compra." };
  }

  if (coupon.type === "free_shipping") {
    return { discount: 0, freeShipping: true };
  }

  let eligibleSubtotal = ctx.subtotal;
  if (!coupon.applies_to_all_products) {
    eligibleSubtotal = ctx.items
      .filter(
        (i) =>
          (ctx.eligibleProductIds?.has(i.productId) ?? false) ||
          (i.categoryId != null && (ctx.eligibleCategoryIds?.has(i.categoryId) ?? false)),
      )
      .reduce((sum, i) => sum + i.subtotal, 0);
    if (eligibleSubtotal <= 0) return { error: "Nenhum item do carrinho é elegível para este cupom." };
  }

  let discount = coupon.type === "percent" ? (eligibleSubtotal * coupon.value) / 100 : Math.min(coupon.value, eligibleSubtotal);
  if (coupon.max_discount_value != null) discount = Math.min(discount, coupon.max_discount_value);

  return { discount: Math.min(discount, ctx.subtotal), freeShipping: false };
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
