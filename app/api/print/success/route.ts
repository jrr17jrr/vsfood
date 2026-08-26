import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { authenticateDevice } from "@/lib/print-devices/auth";

export const runtime = "nodejs";

const bodySchema = z.object({ orderId: z.string().uuid() });

/**
 * Só chamado DEPOIS que o Windows confirma que o job foi enviado corretamente
 * à impressora — nunca no momento do claim. processing -> printed.
 * Escopado por restaurant_id do próprio token: um dispositivo nunca confirma
 * impressão de pedido de outra loja, mesmo sabendo o orderId.
 */
export async function POST(request: Request) {
  const auth = await authenticateDevice(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const db = createServiceRoleClient();
  const { error } = await db
    .from("orders")
    .update({ print_status: "printed", printed_at: new Date().toISOString(), print_error: null })
    .eq("id", parsed.data.orderId)
    .eq("restaurant_id", auth.device.restaurant_id);

  if (error) return NextResponse.json({ error: "Não foi possível confirmar a impressão." }, { status: 500 });

  revalidatePath("/painel/pedidos");
  return NextResponse.json({ ok: true });
}
