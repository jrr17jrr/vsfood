"use server";

import { revalidatePath } from "next/cache";
import { requireRestaurantMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { generatePairingCode, formatPairingCode, hashSecret } from "@/lib/print-devices/token";
import type { PrintDevice } from "@/types/database";

const PAIRING_CODE_TTL_MINUTES = 10;

type Result = { error?: string };

/** Botão "+ Conectar dispositivo" em /painel/impressao — gera o código de 6 dígitos exibido ao dono. */
export async function generatePairingCodeAction(): Promise<{ code: string; expiresAt: string } | { error: string }> {
  const { restaurantId, profile } = await requireRestaurantMembership();
  const supabase = await createClient();

  const code = generatePairingCode();
  const expiresAt = new Date(Date.now() + PAIRING_CODE_TTL_MINUTES * 60_000).toISOString();

  const { error } = await supabase.from("print_pairing_codes").insert({
    restaurant_id: restaurantId,
    code_hash: hashSecret(code),
    expires_at: expiresAt,
    created_by: profile.id,
  });
  if (error) return { error: "Não foi possível gerar o código de conexão." };

  return { code: formatPairingCode(code), expiresAt };
}

export async function listPrintDevicesAction(): Promise<PrintDevice[]> {
  const { restaurantId } = await requireRestaurantMembership();
  const supabase = await createClient();
  const { data } = await supabase
    .from("print_devices")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("active", true)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** "Revogar acesso" — o dispositivo para de autenticar imediatamente (authenticateDevice checa active/revoked_at). */
export async function revokeDeviceAction(deviceId: string): Promise<Result> {
  const { restaurantId } = await requireRestaurantMembership();
  const supabase = await createClient();
  const { error } = await supabase
    .from("print_devices")
    .update({ active: false, revoked_at: new Date().toISOString() })
    .eq("id", deviceId)
    .eq("restaurant_id", restaurantId);
  if (error) return { error: "Não foi possível revogar o dispositivo." };
  revalidatePath("/painel/impressao");
  return {};
}
