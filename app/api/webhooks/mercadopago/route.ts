import { NextResponse, type NextRequest } from "next/server";
import { WebhookSignatureValidator, InvalidWebhookSignatureError } from "mercadopago";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/mercadopago/connection";
import { getRestaurantConfig } from "@/lib/mercadopago/client";
import { getPayment, mapMpStatusToPaymentStatus } from "@/lib/mercadopago/payments";

// Mercado Pago espera 200 rapidamente; qualquer coisa fora disso ele reenvia.
// Por isso: sempre responder 200 depois de validar a assinatura, mesmo em
// cenários que não temos o que processar (evita retentativas infinitas).
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? searchParams.get("topic");
  const dataId = searchParams.get("data.id") ?? searchParams.get("id");

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.error("MERCADOPAGO_WEBHOOK_SECRET não configurado — webhook ignorado.");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    WebhookSignatureValidator.validate({
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      dataId,
      secret,
      toleranceSeconds: 300,
    });
  } catch (err) {
    if (err instanceof InvalidWebhookSignatureError) {
      console.warn("Webhook Mercado Pago com assinatura inválida:", err.reason);
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
    throw err;
  }

  if (type !== "payment" || !dataId) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const db = createServiceRoleClient();

  // Nunca confia no payload do webhook: localiza o pedido pelo id do pagamento
  // que nós mesmos geramos, e busca o estado real na API do Mercado Pago.
  const { data: paymentRow } = await db
    .from("payments")
    .select("id, restaurant_id, order_id")
    .eq("provider_payment_id", dataId)
    .maybeSingle();

  if (!paymentRow) {
    console.warn(`Webhook Mercado Pago: pagamento ${dataId} não encontrado (ainda) na base local.`);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const accessToken = await getValidAccessToken(paymentRow.restaurant_id);
  if (!accessToken) {
    console.error(`Webhook Mercado Pago: restaurante ${paymentRow.restaurant_id} sem conexão ativa.`);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const config = getRestaurantConfig(accessToken);
  const mpPayment = await getPayment(config, dataId);
  const status = mapMpStatusToPaymentStatus(mpPayment.status);

  await db
    .from("payments")
    .update({ status, raw_payload: mpPayment as unknown as Record<string, unknown> })
    .eq("id", paymentRow.id);

  await db.from("orders").update({ payment_status: status }).eq("id", paymentRow.order_id);

  return NextResponse.json({ ok: true }, { status: 200 });
}
