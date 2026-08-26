import { NextResponse } from "next/server";
import { authenticateDevice } from "@/lib/print-devices/auth";
import { claimNextPrintJob } from "@/lib/print-devices/queue";

export const runtime = "nodejs";

/**
 * "Tem pedido pra imprimir?" — claim atômico (claim_next_print_order usa
 * `for update skip locked`, nenhum outro dispositivo pega o mesmo job) e
 * devolve o payload já pronto pra imprimir, ou { job: null } se a fila
 * estiver vazia.
 */
export async function POST(request: Request) {
  const auth = await authenticateDevice(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const job = await claimNextPrintJob(auth.device.restaurant_id);
  return NextResponse.json({ job });
}
