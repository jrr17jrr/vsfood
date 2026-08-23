import { z } from "zod";
import { STORE_THEME_KEYS } from "@/lib/theme/store-theme";

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida — use um hex de 6 dígitos, ex: #FF5A36");

// Mesmas 13 chaves de StoreTheme — z.object com todas obrigatórias, cada uma
// validada como hex de 6 dígitos. Nunca aceita CSS arbitrário.
export const storeThemeSchema = z.object(
  Object.fromEntries(STORE_THEME_KEYS.map((key) => [key, hexColor])) as Record<(typeof STORE_THEME_KEYS)[number], typeof hexColor>,
);
export type StoreThemeFormInput = z.infer<typeof storeThemeSchema>;

export const createRestaurantSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do restaurante"),
  cuisineType: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
});
export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;

export const restaurantAppearanceSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do restaurante"),
  description: z.string().trim().max(280).optional(),
  cuisineType: z.string().trim().optional(),
  theme: storeThemeSchema,
  whatsapp: z.string().trim().optional(),
  instagram: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  cep: z.string().trim().optional(),
  street: z.string().trim().optional(),
  number: z.string().trim().optional(),
  complement: z.string().trim().optional(),
  neighborhood: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  minOrderValue: z.number().min(0),
  estimatedTimeMinutes: z.number().int().min(0),
});
export type RestaurantAppearanceInput = z.infer<typeof restaurantAppearanceSchema>;
