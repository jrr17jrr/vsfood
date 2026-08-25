import "server-only";

import type { Coupon, DeliveryZone } from "@/types/database";

/**
 * `zone: null` com `fee: 0` quando o restaurante não cadastrou nenhuma
 * região (entrega livre pra qualquer bairro, comportamento já existente).
 * Retorna `null` (sem match) quando há regiões cadastradas mas o bairro
 * informado não está em nenhuma delas.
 */
export function matchDeliveryZone(zones: DeliveryZone[], neighborhood: string): { fee: number; zone: DeliveryZone | null } | null {
  if (zones.length === 0) return { fee: 0, zone: null };
  const normalized = neighborhood.trim().toLowerCase();
  const match = zones.find((z) => z.neighborhood.trim().toLowerCase() === normalized);
  return match ? { fee: match.fee, zone: match } : null;
}

/** Frete grátis: `threshold` null/undefined = sem regra. Retorna a taxa final (0 quando o subtotal bate o limite). */
export function applyFreeShipping(fee: number, subtotal: number, threshold: number | null | undefined): number {
  if (threshold != null && subtotal >= threshold) return 0;
  return fee;
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
