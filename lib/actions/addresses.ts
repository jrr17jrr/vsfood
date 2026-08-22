"use server";

import { revalidatePath } from "next/cache";
import { requireCustomer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addressInputSchema, type AddressInput } from "@/lib/validations/checkout";

type ActionResult = { error?: string };

export async function createAddressAction(input: AddressInput & { isDefault?: boolean }): Promise<ActionResult> {
  const profile = await requireCustomer();
  const parsed = addressInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();

  if (input.isDefault) {
    await supabase.from("customer_addresses").update({ is_default: false }).eq("user_id", profile.id);
  }

  const { error } = await supabase
    .from("customer_addresses")
    .insert({ ...parsed.data, user_id: profile.id, is_default: input.isDefault ?? false });

  if (error) return { error: "Não foi possível salvar o endereço." };
  revalidatePath("/minha-conta/enderecos");
  return {};
}

export async function updateAddressAction(
  id: string,
  input: AddressInput & { isDefault?: boolean },
): Promise<ActionResult> {
  const profile = await requireCustomer();
  const parsed = addressInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();

  if (input.isDefault) {
    await supabase.from("customer_addresses").update({ is_default: false }).eq("user_id", profile.id);
  }

  const { error } = await supabase
    .from("customer_addresses")
    .update({ ...parsed.data, is_default: input.isDefault ?? false })
    .eq("id", id)
    .eq("user_id", profile.id);

  if (error) return { error: "Não foi possível atualizar o endereço." };
  revalidatePath("/minha-conta/enderecos");
  return {};
}

export async function deleteAddressAction(id: string): Promise<ActionResult> {
  const profile = await requireCustomer();
  const supabase = await createClient();
  const { error } = await supabase.from("customer_addresses").delete().eq("id", id).eq("user_id", profile.id);
  if (error) return { error: "Não foi possível remover o endereço." };
  revalidatePath("/minha-conta/enderecos");
  return {};
}
