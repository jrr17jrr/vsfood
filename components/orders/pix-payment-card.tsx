"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PixPaymentCard({ qrCode, qrCodeBase64 }: { qrCode: string; qrCodeBase64: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast.success("Código PIX copiado.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o código.");
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-5 text-center">
      <p className="font-semibold">Pague com PIX</p>
      <p className="mt-1 text-sm text-muted-foreground">Aguardando pagamento</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/png;base64,${qrCodeBase64}`}
        alt="QR Code PIX"
        className="mx-auto mt-4 size-52 rounded-xl border"
      />
      <Button variant="outline" className="mt-4" onClick={handleCopy}>
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        Copiar código PIX
      </Button>
    </div>
  );
}
