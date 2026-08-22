import "server-only";

import { Payment, type MercadoPagoConfig } from "mercadopago";
import type { PaymentStatus } from "@/types/database";

export function mapMpStatusToPaymentStatus(mpStatus: string | undefined): PaymentStatus {
  switch (mpStatus) {
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "cancelled":
      return "cancelled";
    case "refunded":
    case "charged_back":
      return "refunded";
    default:
      return "pending";
  }
}

export async function createPixPayment(params: {
  config: MercadoPagoConfig;
  amount: number;
  description: string;
  payerEmail: string;
  externalReference: string;
  notificationUrl: string;
  idempotencyKey: string;
}) {
  const payment = new Payment(params.config);
  return payment.create({
    body: {
      transaction_amount: params.amount,
      description: params.description,
      payment_method_id: "pix",
      payer: { email: params.payerEmail },
      external_reference: params.externalReference,
      notification_url: params.notificationUrl,
    },
    requestOptions: { idempotencyKey: params.idempotencyKey },
  });
}

export async function createCardPayment(params: {
  config: MercadoPagoConfig;
  amount: number;
  description: string;
  token: string;
  installments: number;
  paymentMethodId: string;
  issuerId?: string;
  payerEmail: string;
  externalReference: string;
  notificationUrl: string;
  idempotencyKey: string;
}) {
  const payment = new Payment(params.config);
  return payment.create({
    body: {
      transaction_amount: params.amount,
      description: params.description,
      token: params.token,
      installments: params.installments,
      payment_method_id: params.paymentMethodId,
      issuer_id: params.issuerId ? Number(params.issuerId) : undefined,
      payer: { email: params.payerEmail },
      external_reference: params.externalReference,
      notification_url: params.notificationUrl,
    },
    requestOptions: { idempotencyKey: params.idempotencyKey },
  });
}

export async function getPayment(config: MercadoPagoConfig, paymentId: string | number) {
  const payment = new Payment(config);
  return payment.get({ id: String(paymentId) });
}
