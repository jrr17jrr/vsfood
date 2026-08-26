import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { authenticateDevice } from "@/lib/print-devices/auth";

export const runtime = "nodejs";

/** Info que o app mostra ao abrir/reconectar: nome da loja e o próprio nome do dispositivo. */
export async function GET(request: Request) {
  const auth = await authenticateDevice(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const db = createServiceRoleClient();
  const { data: restaurant } = await db
    .from("restaurants")
    .select("name, auto_print_enabled")
    .eq("id", auth.device.restaurant_id)
    .maybeSingle();

  return NextResponse.json({
    deviceId: auth.device.id,
    deviceName: auth.device.name,
    restaurantName: restaurant?.name ?? "",
    autoPrintEnabled: restaurant?.auto_print_enabled ?? false,
  });
}
