import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { authenticateDevice } from "@/lib/print-devices/auth";

export const runtime = "nodejs";

const bodySchema = z.object({
  appVersion: z.string().trim().max(20).optional(),
  platform: z.string().trim().max(40).optional(),
});

/** Chamado a cada 30–60s pelo VSFood Print — atualiza last_seen_at (usado pelo painel pra mostrar online/offline). */
export async function POST(request: Request) {
  const auth = await authenticateDevice(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);

  const db = createServiceRoleClient();
  await db
    .from("print_devices")
    .update({
      last_seen_at: new Date().toISOString(),
      ...(parsed.success && parsed.data.appVersion ? { app_version: parsed.data.appVersion } : {}),
      ...(parsed.success && parsed.data.platform ? { platform: parsed.data.platform } : {}),
    })
    .eq("id", auth.device.id);

  return NextResponse.json({ ok: true });
}
