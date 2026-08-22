import { z } from "zod";

export const couponInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Informe o código")
    .transform((v) => v.toUpperCase()),
  type: z.enum(["percent", "fixed"]),
  value: z.number().positive("Informe um valor válido"),
  minOrderValue: z.number().min(0),
  startsAt: z.string().trim().optional(),
  endsAt: z.string().trim().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  active: z.boolean(),
});
export type CouponInput = z.infer<typeof couponInputSchema>;
