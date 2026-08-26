"use server";

import { z } from "zod";
import { requireCustomer } from "@/lib/auth";
import { getConnectionStatus } from "@/lib/mercadopago/connection";
import { restaurantHasFeature } from "@/lib/plans/features";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { resolveDeliveryQuote, type DeliveryQuote } from "@/lib/orders/delivery-pricing";
import { evaluateCoupon } from "@/lib/orders/pricing";
import { resolveOrderItems, type CartItemInput } from "@/lib/orders/resolve-items";
import { geocodeAddress } from "@/lib/geocoding/nominatim";
import { addressInputSchema } from "@/lib/validations/checkout";

export async function getPaymentCapabilitiesAction(
  restaurantId: string,
): Promise<{ onlineAvailable: boolean; publicKey: string | null }> {
  const [status, hasFeature] = await Promise.all([
    getConnectionStatus(restaurantId),
    restaurantHasFeature(restaurantId, "online_payment"),
  ]);
  return { onlineAvailable: status.connected && hasFeature, publicKey: status.publicKey };
}

const deliveryQuoteAddressSchema = addressInputSchema.pick({
  street: true,
  number: true,
  neighborhood: true,
  city: true,
  state: true,
});
export type DeliveryQuoteAddress = z.infer<typeof deliveryQuoteAddressSchema>;

const deliveryQuoteSchema = z.object({
  restaurantId: z.string().uuid(),
  address: deliveryQuoteAddressSchema,
});

/**
 * Preview de entrega usado pelo checkout (distância/taxa/fora-da-área). É só
 * um preview — createOrderAction recalcula tudo de novo a partir do banco na
 * hora de criar o pedido, nunca confia no que essa action devolveu.
 */
export async function getDeliveryQuoteAction(
  restaurantId: string,
  address: DeliveryQuoteAddress,
): Promise<DeliveryQuote> {
  const parsed = deliveryQuoteSchema.safeParse({ restaurantId, address });
  if (!parsed.success) return { eligible: false, reason: "Endereço incompleto." };
  const a = parsed.data.address;

  const db = createServiceRoleClient();
  const { data: restaurant } = await db.from("restaurants").select("*").eq("id", restaurantId).maybeSingle();
  if (!restaurant) return { eligible: false, reason: "Restaurante não encontrado." };

  if (restaurant.delivery_charge_mode === "neighborhood") {
    const { data: zones } = await db
      .from("delivery_zones")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("active", true);
    return resolveDeliveryQuote(restaurant, zones ?? [], [], {
      state: a.state,
      city: a.city,
      neighborhood: a.neighborhood,
      latitude: null,
      longitude: null,
    });
  }

  const { data: tiers } = await db.from("delivery_distance_tiers").select("*").eq("restaurant_id", restaurantId);

  const geocoded = await geocodeAddress(`${a.street}, ${a.number}, ${a.neighborhood}, ${a.city}, ${a.state}, Brasil`);

  return resolveDeliveryQuote(restaurant, [], tiers ?? [], {
    state: a.state,
    city: a.city,
    neighborhood: a.neighborhood,
    latitude: geocoded?.latitude ?? null,
    longitude: geocoded?.longitude ?? null,
  });
}

const previewCouponSchema = z.object({
  restaurantId: z.string().uuid(),
  code: z.string().trim().min(1),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().min(1),
      optionIds: z.array(z.object({ groupId: z.string().uuid(), optionId: z.string().uuid() })).default([]),
    }),
  ),
  deliveryType: z.enum(["delivery", "pickup"]),
});

export type CouponPreviewResult = { discount: number; freeShipping: boolean } | { error: string };

/**
 * Preview de cupom aplicado no checkout, antes de finalizar o pedido — usa a
 * mesma lógica (resolveOrderItems + evaluateCoupon) que createOrderAction usa
 * de verdade, mas não grava nada. O pedido real recalcula tudo de novo.
 */
export async function previewCouponAction(input: {
  restaurantId: string;
  code: string;
  items: CartItemInput[];
  deliveryType: "delivery" | "pickup";
}): Promise<CouponPreviewResult> {
  const profile = await requireCustomer();
  const parsed = previewCouponSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  const db = createServiceRoleClient();
  const resolution = await resolveOrderItems(db, parsed.data.restaurantId, parsed.data.items);
  if ("error" in resolution) return { error: resolution.error };
  const { resolvedItems, subtotal } = resolution;

  const { data: coupon } = await db
    .from("coupons")
    .select("*")
    .eq("restaurant_id", parsed.data.restaurantId)
    .ilike("code", parsed.data.code.trim())
    .maybeSingle();
  if (!coupon) return { error: "Cupom não encontrado." };

  const [{ count: usedByCustomerCount }, { count: priorOrdersCount }, { data: eligibleProducts }, { data: eligibleCategories }] =
    await Promise.all([
      db.from("coupon_usages").select("id", { count: "exact", head: true }).eq("coupon_id", coupon.id).eq("user_id", profile.id),
      db
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", parsed.data.restaurantId)
        .eq("customer_id", profile.id),
      coupon.applies_to_all_products
        ? Promise.resolve({ data: [] as { product_id: string }[] })
        : db.from("coupon_products").select("product_id").eq("coupon_id", coupon.id),
      coupon.applies_to_all_products
        ? Promise.resolve({ data: [] as { category_id: string }[] })
        : db.from("coupon_categories").select("category_id").eq("coupon_id", coupon.id),
    ]);

  const evaluation = evaluateCoupon(coupon, {
    subtotal,
    items: resolvedItems.map((i) => ({ productId: i.productId, categoryId: i.categoryId, subtotal: i.subtotal })),
    deliveryType: parsed.data.deliveryType,
    isFirstPurchase: (priorOrdersCount ?? 0) === 0,
    usedByCustomerCount: usedByCustomerCount ?? 0,
    eligibleProductIds: coupon.applies_to_all_products ? null : new Set((eligibleProducts ?? []).map((p) => p.product_id)),
    eligibleCategoryIds: coupon.applies_to_all_products ? null : new Set((eligibleCategories ?? []).map((c) => c.category_id)),
  });
  if ("error" in evaluation) return { error: evaluation.error };
  return evaluation;
}
