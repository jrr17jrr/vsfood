"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCustomer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { onlyDigits } from "@/lib/format";

const whatsappSchema = z
  .string()
  .trim()
  .refine((v) => onlyDigits(v).length >= 10 && onlyDigits(v).length <= 11, "WhatsApp inválido");

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo"),
  whatsapp: whatsappSchema,
});

export async function updateProfileAction(input: {
  name: string;
  whatsapp: string;
}): Promise<{ error?: string }> {
  const profile = await requireCustomer();
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ name: parsed.data.name, whatsapp: onlyDigits(parsed.data.whatsapp) })
    .eq("id", profile.id);

  if (error) {
    if (error.code === "23505") return { error: "Este WhatsApp já está em uso por outra conta." };
    return { error: "Não foi possível salvar suas informações." };
  }

  revalidatePath("/minha-conta");
  return {};
}

/**
 * Usado pelo gate de WhatsApp no checkout: clientes que entraram pela
 * primeira vez com Google não têm WhatsApp (o Google não fornece esse dado).
 * Atualiza apenas o WhatsApp, sem exigir os demais campos do perfil.
 */
export async function updateWhatsappAction(whatsapp: string): Promise<{ error?: string }> {
  const profile = await requireCustomer();
  const parsed = whatsappSchema.safeParse(whatsapp);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "WhatsApp inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ whatsapp: onlyDigits(parsed.data) })
    .eq("id", profile.id);

  if (error) {
    if (error.code === "23505") return { error: "Este WhatsApp já está em uso por outra conta." };
    return { error: "Não foi possível salvar seu WhatsApp." };
  }

  revalidatePath("/checkout");
  revalidatePath("/minha-conta");
  return {};
}
