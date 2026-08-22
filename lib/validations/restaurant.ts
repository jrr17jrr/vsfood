import { z } from "zod";

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
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
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
