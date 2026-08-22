"use server";

import { revalidatePath } from "next/cache";
import { requireRestaurantMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { couponInputSchema, type CouponInput } from "@/lib/validations/coupon";

type Result = { error?: string };

export async function createCouponAction(input: CouponInput): Promise<Result> {
  const { restaurantId } = await requireRestaurantMembership();
  const parsed = couponInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("coupons").insert({
    restaurant_id: restaurantId,
    code: parsed.data.code,
    type: parsed.data.type,
    value: parsed.data.value,
    min_order_value: parsed.data.minOrderValue,
    starts_at: parsed.data.startsAt || null,
    ends_at: parsed.data.endsAt || null,
    usage_limit: parsed.data.usageLimit || null,
    active: parsed.data.active,
  });

  if (error) {
    if (error.code === "23505") return { error: "Já existe um cupom com este código." };
    return { error: "Não foi possível criar o cupom." };
  }
  revalidatePath("/painel/cupons");
  return {};
}

export async function updateCouponAction(id: string, input: CouponInput): Promise<Result> {
  await requireRestaurantMembership();
  const parsed = couponInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("coupons")
    .update({
      code: parsed.data.code,
      type: parsed.data.type,
      value: parsed.data.value,
      min_order_value: parsed.data.minOrderValue,
      starts_at: parsed.data.startsAt || null,
      ends_at: parsed.data.endsAt || null,
      usage_limit: parsed.data.usageLimit || null,
      active: parsed.data.active,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "Já existe um cupom com este código." };
    return { error: "Não foi possível atualizar o cupom." };
  }
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
