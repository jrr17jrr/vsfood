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
  unlimitedStock: z.boolean(),
  stockQuantity: z.number().int("Estoque precisa ser um número inteiro").min(0, "Estoque não pode ser negativo"),
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const optionGroupPricingModeSchema = z.enum(["no_charge", "per_option", "free_first_n", "highest_only", "fixed_price"]);

export const optionGroupInputSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome do grupo"),
    required: z.boolean(),
    minSelect: z.number().int().min(0),
    maxSelect: z.number().int().min(1),
    pricingMode: optionGroupPricingModeSchema,
    freeQuantity: z.number().int().min(0),
    fixedPrice: z.number().min(0, "Valor inválido"),
  })
  .refine((v) => v.minSelect <= v.maxSelect, {
    message: "O mínimo não pode ser maior que o máximo",
    path: ["minSelect"],
  })
  .refine((v) => !v.required || v.minSelect >= 1, {
    message: "Grupo obrigatório precisa de mínimo pelo menos 1",
    path: ["minSelect"],
  })
  .refine((v) => v.pricingMode !== "free_first_n" || v.freeQuantity <= v.maxSelect, {
    message: "A quantidade grátis não pode ser maior que o máximo de escolhas",
    path: ["freeQuantity"],
  });
export type OptionGroupInput = z.infer<typeof optionGroupInputSchema>;

export const optionInputSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do adicional"),
  price: z.number().min(0),
  available: z.boolean(),
});
export type OptionInput = z.infer<typeof optionInputSchema>;
