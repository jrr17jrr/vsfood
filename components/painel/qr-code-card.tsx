"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QrCodeCard({ slug }: { slug: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://vsfood.com.br"}/loja/${slug}`;

  useEffect(() => {
    QRCode.toDataURL(url, { width: 320, margin: 2, color: { dark: "#1a1a1a", light: "#ffffff" } }).then(setDataUrl);
  }, [url]);

  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="font-semibold">QR Code da sua loja</p>
      <p className="mt-1 text-sm text-muted-foreground">{url}</p>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="QR Code da loja" className="size-40 rounded-xl border" />
        ) : (
          <div className="size-40 animate-pulse rounded-xl bg-muted" />
        )}
        <Button asChild disabled={!dataUrl} variant="outline">
          <a href={dataUrl ?? "#"} download={`vsfood-${slug}-qrcode.png`}>
            <Download className="size-4" />
            Baixar QR Code
          </a>
        </Button>
      </div>
    </div>
  );
}
