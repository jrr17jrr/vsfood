"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRestaurantMembership } from "@/lib/auth";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { Order } from "@/types/database";

type Result = { error?: string };

/**
 * Pega o próximo pedido pendente de impressão da loja autenticada, de forma
 * atômica (claim_next_print_order usa `for update skip locked` — nunca duas
 * chamadas concorrentes pegam o mesmo pedido). Pronta pro futuro VSFood
 * Print chamar; hoje nada na UI aciona isso (não existe dispositivo).
 */
export async function claimNextPrintJobAction(): Promise<{ order: Order | null } | { error: string }> {
  const { restaurantId } = await requireRestaurantMembership();
  const db = createServiceRoleClient();
  const { data, error } = await db.rpc("claim_next_print_order", { p_restaurant_id: restaurantId });
  if (error) return { error: "Não foi possível buscar o próximo pedido da fila." };
  return { order: data ?? null };
}

async function updateOwnedOrderPrintState(orderId: string, patch: Partial<Order>): Promise<Result> {
  const { restaurantId } = await requireRestaurantMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("orders").update(patch).eq("id", orderId).eq("restaurant_id", restaurantId);
  if (error) return { error: "Não foi possível atualizar o estado de impressão do pedido." };
  revalidatePath("/painel/pedidos");
  return {};
}

/** Chamada pelo futuro VSFood Print após a impressora confirmar sucesso — nunca no momento da criação do pedido. */
export async function confirmPrintAction(orderId: string): Promise<Result> {
  return updateOwnedOrderPrintState(orderId, {
    print_status: "printed",
    printed_at: new Date().toISOString(),
    print_error: null,
  });
}

/** Chamada pelo futuro VSFood Print quando a impressão falha (papel, offline, etc). */
export async function failPrintAction(orderId: string, errorMessage: string): Promise<Result> {
  return updateOwnedOrderPrintState(orderId, { print_status: "failed", print_error: errorMessage.slice(0, 500) });
}

/** Botão "Reimprimir pedido" no painel — só recoloca na fila, não imprime nada aqui. */
export async function requestReprintAction(orderId: string): Promise<Result> {
  return updateOwnedOrderPrintState(orderId, { print_status: "pending", print_error: null });
}

const printSettingsSchema = z.object({
  printFormat: z.enum(["a4", "80mm", "58mm"]),
  printCopies: z.number().int().min(1).max(5),
  printShowPrices: z.boolean(),
  printShowAddress: z.boolean(),
  printShowPhone: z.boolean(),
  printShowNotes: z.boolean(),
});
export type PrintSettingsInput = z.infer<typeof printSettingsSchema>;

export async function updatePrintSettingsAction(input: PrintSettingsInput): Promise<Result> {
  const { restaurantId } = await requireRestaurantMembership();
  const parsed = printSettingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update({
      print_format: parsed.data.printFormat,
      print_copies: parsed.data.printCopies,
      print_show_prices: parsed.data.printShowPrices,
      print_show_address: parsed.data.printShowAddress,
      print_show_phone: parsed.data.printShowPhone,
      print_show_notes: parsed.data.printShowNotes,
    })
    .eq("id", restaurantId);
  if (error) return { error: "Não foi possível salvar as configurações de impressão." };
  revalidatePath("/painel/impressao");
  return {};
}
