import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateDeviceToken, hashSecret, normalizePairingCode } from "@/lib/print-devices/token";
import { isRateLimited, clientIp } from "@/lib/print-devices/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.object({
  code: z.string().min(1),
  deviceName: z.string().trim().min(1).max(80).optional(),
  platform: z.string().trim().max(40).optional(),
  appVersion: z.string().trim().max(20).optional(),
});

/**
 * Troca um código de pareamento (curto, uso único, gerado no painel) por um
 * token de dispositivo de longa duração. Único endpoint de /api/print/* que
 * não autentica por token de dispositivo — é exatamente aqui que o token
 * nasce. Por isso o rate limit por IP: um código de 6 dígitos tem pouca
 * entropia, e sem isso daria pra tentar força bruta antes de expirar.
 */
export async function POST(request: Request) {
  if (isRateLimited(`pair:${clientIp(request)}`, 10, 5 * 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." }, { status: 429 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const code = normalizePairingCode(parsed.data.code);
  if (code.length !== 6) {
    return NextResponse.json({ error: "Código de conexão inválido." }, { status: 400 });
  }

  const db = createServiceRoleClient();
  const codeHash = hashSecret(code);

  // Claim atômico do código: o UPDATE só afeta a linha se ainda não tiver sido
  // usada e ainda não tiver expirado — duas tentativas simultâneas com o
  // mesmo código nunca conseguem parear dois dispositivos com um único código.
  const { data: pairing } = await db
    .from("print_pairing_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("code_hash", codeHash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("restaurant_id")
    .maybeSingle();

  if (!pairing) {
    return NextResponse.json({ error: "Código inválido ou expirado." }, { status: 400 });
  }

  const rawToken = generateDeviceToken();
  const { data: device, error } = await db
    .from("print_devices")
    .insert({
      restaurant_id: pairing.restaurant_id,
      token_hash: hashSecret(rawToken),
      name: parsed.data.deviceName ?? "Computador",
      platform: parsed.data.platform ?? null,
      app_version: parsed.data.appVersion ?? null,
      last_seen_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !device) {
    return NextResponse.json({ error: "Não foi possível concluir o pareamento." }, { status: 500 });
  }

  const { data: restaurant } = await db.from("restaurants").select("name").eq("id", pairing.restaurant_id).maybeSingle();

  return NextResponse.json({
    token: rawToken,
    deviceId: device.id,
    restaurantName: restaurant?.name ?? "",
  });
}
