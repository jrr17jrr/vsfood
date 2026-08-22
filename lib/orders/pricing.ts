import "server-only";

import type { Coupon, DeliveryZone } from "@/types/database";

export function matchDeliveryFee(zones: DeliveryZone[], neighborhood: string): number | null {
  if (zones.length === 0) return 0;
  const normalized = neighborhood.trim().toLowerCase();
  const match = zones.find((z) => z.neighborhood.trim().toLowerCase() === normalized);
  return match ? match.fee : null;
}

export type CouponEvaluation = { discount: number } | { error: string };

export function evaluateCoupon(coupon: Coupon | null, subtotal: number): CouponEvaluation {
  if (!coupon) return { error: "Cupom não encontrado." };
  if (!coupon.active) return { error: "Este cupom não está mais ativo." };

  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) return { error: "Este cupom ainda não é válido." };
  if (coupon.ends_at && new Date(coupon.ends_at) < now) return { error: "Este cupom expirou." };
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    return { error: "Este cupom atingiu o limite de usos." };
  }
  if (subtotal < coupon.min_order_value) {
    return { error: `Pedido mínimo para este cupom: ${coupon.min_order_value.toFixed(2)}.` };
  }

  const discount = coupon.type === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
  return { discount: Math.min(discount, subtotal) };
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
