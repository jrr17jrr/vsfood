import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { hashSecret } from "./token";
import type { PrintDevice } from "@/types/database";

type AuthResult = { device: PrintDevice } | { error: string; status: number };

/**
 * Autentica uma requisição do VSFood Print pelo token de dispositivo (nunca
 * por restaurant_id vindo do corpo/query — sempre derivado do token). Mesmo
 * princípio de "nunca confiar em id solto do client" de claim_next_print_order.
 */
export async function authenticateDevice(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) return { error: "Token de dispositivo ausente.", status: 401 };

  const db = createServiceRoleClient();
  const { data: device } = await db
    .from("print_devices")
    .select("*")
    .eq("token_hash", hashSecret(token))
    .maybeSingle();

  if (!device || !device.active || device.revoked_at) {
    return { error: "Dispositivo não autorizado. Reconecte pelo VSFood Print.", status: 401 };
  }

  return { device };
}
