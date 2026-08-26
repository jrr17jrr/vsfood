import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { authenticateDevice } from "@/lib/print-devices/auth";

export const runtime = "nodejs";

const bodySchema = z.object({ orderId: z.string().uuid(), error: z.string().trim().min(1).max(500) });

/** processing -> failed. Pedido continua na fila (retry manual pelo painel ou automático limitado pelo próprio app). */
export async function POST(request: Request) {
  const auth = await authenticateDevice(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const db = createServiceRoleClient();
  const { error } = await db
    .from("orders")
    .update({ print_status: "failed", print_error: parsed.data.error.slice(0, 500) })
    .eq("id", parsed.data.orderId)
    .eq("restaurant_id", auth.device.restaurant_id);

  if (error) return NextResponse.json({ error: "Não foi possível registrar a falha." }, { status: 500 });

  revalidatePath("/painel/pedidos");
  return NextResponse.json({ ok: true });
}
