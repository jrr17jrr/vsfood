import { z } from "zod";

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da categoria"),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const productInputSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do produto"),
  description: z.string().trim().max(500).optional(),
  price: z.number().min(0, "Preço inválido"),
  promoPrice: z.number().min(0).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  imageUrl: z.string().trim().nullable().optional(),
  available: z.boolean(),
  featured: z.boolean(),
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const optionGroupInputSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do grupo"),
  required: z.boolean(),
  minSelect: z.number().int().min(0),
  maxSelect: z.number().int().min(1),
});
export type OptionGroupInput = z.infer<typeof optionGroupInputSchema>;

export const optionInputSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do adicional"),
  price: z.number().min(0),
  available: z.boolean(),
});
export type OptionInput = z.infer<typeof optionInputSchema>;
