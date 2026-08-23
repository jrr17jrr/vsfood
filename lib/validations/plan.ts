import { z } from "zod";

export const planSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Informe o código interno")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífen"),
  name: z.string().trim().min(2, "Informe o nome do plano"),
  description: z.string().trim().optional(),
  complementText: z.string().trim().optional(),
  ctaLabel: z.string().trim().min(1, "Informe o texto do CTA"),
  priceMonthly: z.number().min(0).nullable(),
  priceYearly: z.number().min(0).nullable(),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  displayOrder: z.number().int(),
  trialDaysDefault: z.number().int().min(0),
});
export type PlanInput = z.infer<typeof planSchema>;

export const planFeatureSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2, "Informe a chave interna")
    .regex(/^[a-z0-9]+(_[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e underscore"),
  name: z.string().trim().min(2, "Informe o nome da funcionalidade"),
  description: z.string().trim().optional(),
  isActive: z.boolean(),
  displayOrder: z.number().int(),
});
export type PlanFeatureInput = z.infer<typeof planFeatureSchema>;
