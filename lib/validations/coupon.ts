import { z } from "zod";

export const couponInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, "Informe o código")
      .transform((v) => v.toUpperCase()),
    type: z.enum(["percent", "fixed", "free_shipping"]),
    value: z.number().min(0),
    minOrderValue: z.number().min(0),
    maxDiscountValue: z.number().min(0).nullable().optional(),
    startsAt: z.string().trim().optional(),
    endsAt: z.string().trim().optional(),
    usageLimit: z.number().int().positive().nullable().optional(),
    usageLimitPerCustomer: z.number().int().positive().nullable().optional(),
    active: z.boolean(),
    appliesToDelivery: z.boolean(),
    appliesToPickup: z.boolean(),
    firstPurchaseOnly: z.boolean(),
    appliesToAllProducts: z.boolean(),
    categoryIds: z.array(z.string().uuid()),
    productIds: z.array(z.string().uuid()),
  })
  .refine((v) => v.type === "free_shipping" || v.value > 0, {
    message: "Informe um valor válido",
    path: ["value"],
  })
  .refine((v) => v.appliesToDelivery || v.appliesToPickup, {
    message: "O cupom precisa valer para entrega, retirada ou ambos",
    path: ["appliesToDelivery"],
  });
export type CouponInput = z.infer<typeof couponInputSchema>;
