"use server";

import { revalidatePath } from "next/cache";
import { requireRestaurantMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { couponInputSchema, type CouponInput } from "@/lib/validations/coupon";
import type { Coupon } from "@/types/database";

type Result = { error?: string };

function couponRow(restaurantId: string, input: CouponInput) {
  return {
    restaurant_id: restaurantId,
    code: input.code,
    type: input.type,
    value: input.value,
    min_order_value: input.minOrderValue,
    max_discount_value: input.maxDiscountValue ?? null,
    starts_at: input.startsAt || null,
    ends_at: input.endsAt || null,
    usage_limit: input.usageLimit || null,
    usage_limit_per_customer: input.usageLimitPerCustomer || null,
    active: input.active,
    applies_to_delivery: input.appliesToDelivery,
    applies_to_pickup: input.appliesToPickup,
    first_purchase_only: input.firstPurchaseOnly,
    applies_to_all_products: input.appliesToAllProducts,
  };
}

async function syncCouponLinks(couponId: string, input: CouponInput): Promise<void> {
  const supabase = await createClient();
  await Promise.all([
    supabase.from("coupon_categories").delete().eq("coupon_id", couponId),
    supabase.from("coupon_products").delete().eq("coupon_id", couponId),
  ]);
  if (input.appliesToAllProducts) return;

  await Promise.all([
    input.categoryIds.length > 0
      ? supabase.from("coupon_categories").insert(input.categoryIds.map((category_id) => ({ coupon_id: couponId, category_id })))
      : Promise.resolve(),
    input.productIds.length > 0
      ? supabase.from("coupon_products").insert(input.productIds.map((product_id) => ({ coupon_id: couponId, product_id })))
      : Promise.resolve(),
  ]);
}

export async function createCouponAction(input: CouponInput): Promise<Result> {
  const { restaurantId } = await requireRestaurantMembership();
  const parsed = couponInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data, error } = await supabase.from("coupons").insert(couponRow(restaurantId, parsed.data)).select("id").single();

  if (error || !data) {
    if (error?.code === "23505") return { error: "Já existe um cupom com este código." };
    return { error: "Não foi possível criar o cupom." };
  }
  await syncCouponLinks(data.id, parsed.data);
  revalidatePath("/painel/cupons");
  return {};
}

export async function updateCouponAction(id: string, input: CouponInput): Promise<Result> {
  const { restaurantId } = await requireRestaurantMembership();
  const parsed = couponInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("coupons").update(couponRow(restaurantId, parsed.data)).eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "Já existe um cupom com este código." };
    return { error: "Não foi possível atualizar o cupom." };
  }
  await syncCouponLinks(id, parsed.data);
  revalidatePath("/painel/cupons");
  return {};
}

export async function deleteCouponAction(id: string): Promise<Result> {
  await requireRestaurantMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir o cupom." };
  revalidatePath("/painel/cupons");
  return {};
}

export type CouponWithLinks = Coupon & { categoryIds: string[]; productIds: string[] };

/** Usado pra abrir o formulário de "duplicar" pré-preenchido (não grava nada). */
export async function getCouponWithLinksAction(id: string): Promise<CouponWithLinks | null> {
  await requireRestaurantMembership();
  const supabase = await createClient();
  const [{ data: coupon }, { data: categories }, { data: products }] = await Promise.all([
    supabase.from("coupons").select("*").eq("id", id).maybeSingle(),
    supabase.from("coupon_categories").select("category_id").eq("coupon_id", id),
    supabase.from("coupon_products").select("product_id").eq("coupon_id", id),
  ]);
  if (!coupon) return null;
  return {
    ...coupon,
    categoryIds: (categories ?? []).map((c) => c.category_id),
    productIds: (products ?? []).map((p) => p.product_id),
  };
}
