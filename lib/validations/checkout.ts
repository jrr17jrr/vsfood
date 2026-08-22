import { z } from "zod";

export const addressInputSchema = z.object({
  label: z.string().trim().optional(),
  cep: z.string().trim().optional(),
  street: z.string().trim().min(2, "Informe a rua"),
  number: z.string().trim().min(1, "Informe o número"),
  complement: z.string().trim().optional(),
  neighborhood: z.string().trim().min(2, "Informe o bairro"),
  city: z.string().trim().min(2, "Informe a cidade"),
  state: z.string().trim().optional(),
  reference: z.string().trim().optional(),
});
export type AddressInput = z.infer<typeof addressInputSchema>;

const cartOptionSchema = z.object({
  groupId: z.string().uuid(),
  optionId: z.string().uuid(),
});

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
  notes: z.string().trim().max(280).optional().default(""),
  optionIds: z.array(cartOptionSchema).default([]),
});

const cardPaymentSchema = z.object({
  token: z.string().min(1),
  installments: z.number().int().min(1),
  paymentMethodId: z.string().min(1),
  issuerId: z.string().optional(),
});
export type CardPaymentInput = z.infer<typeof cardPaymentSchema>;

export const createOrderSchema = z.object({
  restaurantId: z.string().uuid(),
  items: z.array(cartItemSchema).min(1, "Seu carrinho está vazio"),
  deliveryType: z.enum(["delivery", "pickup"]),
  addressId: z.string().uuid().optional(),
  newAddress: addressInputSchema.optional(),
  couponCode: z.string().trim().optional(),
  paymentMethod: z.enum(["pix_manual", "cash", "card_on_delivery", "pix_online", "card_online"]),
  needsChange: z.boolean().optional(),
  changeFor: z.number().nonnegative().optional(),
  notes: z.string().trim().max(280).optional(),
  card: cardPaymentSchema.optional(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
