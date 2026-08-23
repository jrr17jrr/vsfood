import { z } from "zod";

const slugField = z
  .string()
  .trim()
  .min(2, "Informe o slug")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífen");

const accessTypeField = z.enum(["trial", "subscriber", "demo"]);
const statusField = z.enum(["trial", "active", "expired", "suspended"]);

export const createRestaurantByAdminSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do restaurante"),
  slug: slugField,
  ownerName: z.string().trim().min(2, "Informe o nome do responsável"),
  whatsapp: z
    .string()
    .trim()
    .min(1, "Informe o WhatsApp")
    .refine((v) => v.replace(/\D/g, "").length >= 10 && v.replace(/\D/g, "").length <= 11, "WhatsApp inválido"),
  email: z.string().trim().min(1, "Informe o e-mail").email("E-mail inválido"),
  password: z.string().min(6, "A senha precisa ter no mínimo 6 caracteres"),
  planId: z.string().uuid("Selecione um plano"),
  accessType: accessTypeField,
  trialDays: z.number().int().min(0, "Dias de teste inválidos"),
  status: statusField,
});
export type CreateRestaurantByAdminInput = z.infer<typeof createRestaurantByAdminSchema>;

export const linkExistingOwnerSchema = z.object({
  profileId: z.string().uuid(),
  name: z.string().trim().min(2, "Informe o nome do restaurante"),
  slug: slugField,
  planId: z.string().uuid("Selecione um plano"),
  accessType: accessTypeField,
  trialDays: z.number().int().min(0, "Dias de teste inválidos"),
  status: statusField,
});
export type LinkExistingOwnerInput = z.infer<typeof linkExistingOwnerSchema>;

export const checkSlugSchema = z.object({ slug: slugField });
