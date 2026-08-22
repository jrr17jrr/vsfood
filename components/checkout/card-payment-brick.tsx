"use client";

import { useEffect, useState } from "react";
import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";
import { Loader2 } from "lucide-react";

export type CardBrickSubmitData = {
  token: string;
  installments: number;
  paymentMethodId: string;
  issuerId?: string;
};

type CardBrickFormData = {
  token: string;
  installments: number;
  payment_method_id: string;
  issuer_id: string;
};

export function CardPaymentBrick({
  publicKey,
  amount,
  payerEmail,
  submitting,
  onSubmit,
}: {
  publicKey: string;
  amount: number;
  payerEmail: string;
  submitting: boolean;
  onSubmit: (data: CardBrickSubmitData) => Promise<void>;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initMercadoPago(publicKey, { locale: "pt-BR" });
  }, [publicKey]);

  async function handleSubmit(formData: CardBrickFormData) {
    await onSubmit({
      token: formData.token,
      installments: formData.installments,
      paymentMethodId: formData.payment_method_id,
      issuerId: formData.issuer_id,
    });
  }

  return (
    <div className="relative">
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {submitting && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Loader2 className="size-4 animate-spin" />
            Processando pagamento...
          </p>
        </div>
      )}
      <CardPayment
        initialization={{ amount, payer: { email: payerEmail } }}
        onSubmit={handleSubmit}
        onReady={() => setReady(true)}
        locale="pt-BR"
      />
    </div>
  );
}
