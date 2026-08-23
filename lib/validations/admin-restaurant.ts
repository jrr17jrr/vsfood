import { z } from "zod";

export const createRestaurantByAdminSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do restaurante"),
  slug: z
    .string()
    .trim()
    .min(2, "Informe o slug")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífen"),
  ownerName: z.string().trim().min(2, "Informe o nome do responsável"),
  whatsapp: z
    .string()
    .trim()
    .min(1, "Informe o WhatsApp")
    .refine((v) => v.replace(/\D/g, "").length >= 10 && v.replace(/\D/g, "").length <= 11, "WhatsApp inválido"),
  email: z.string().trim().min(1, "Informe o e-mail").email("E-mail inválido"),
  password: z.string().min(6, "A senha precisa ter no mínimo 6 caracteres"),
  plan: z.string().trim().min(1, "Informe o plano"),
  trialDays: z.number().int().min(0, "Dias de teste inválidos"),
  status: z.enum(["trial", "active", "expired", "suspended"]),
});
export type CreateRestaurantByAdminInput = z.infer<typeof createRestaurantByAdminSchema>;

export const linkExistingOwnerSchema = z.object({
  profileId: z.string().uuid(),
  name: z.string().trim().min(2, "Informe o nome do restaurante"),
  slug: z
    .string()
    .trim()
    .min(2, "Informe o slug")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífen"),
  plan: z.string().trim().min(1, "Informe o plano"),
  trialDays: z.number().int().min(0, "Dias de teste inválidos"),
  status: z.enum(["trial", "active", "expired", "suspended"]),
});
export type LinkExistingOwnerInput = z.infer<typeof linkExistingOwnerSchema>;
