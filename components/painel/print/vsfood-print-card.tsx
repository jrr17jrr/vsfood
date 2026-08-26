import { Download, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DOWNLOAD_URL = process.env.NEXT_PUBLIC_VSFOOD_PRINT_DOWNLOAD_URL;

/** Card de apresentação/download do app desktop — a lista de dispositivos pareados fica em DevicesCard, logo abaixo. */
export function VsfoodPrintCard() {
  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Monitor className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">VSFood Print</p>
          <p className="text-xs text-muted-foreground">
            Aplicativo pra Windows que imprime seus pedidos automaticamente, direto na cozinha.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {DOWNLOAD_URL ? (
          <Button asChild size="sm">
            <a href={DOWNLOAD_URL}>
              <Download className="size-4" />
              Baixar VSFood Print para Windows
            </a>
          </Button>
        ) : (
          <Button size="sm" disabled>
            <Download className="size-4" />
            Baixar VSFood Print para Windows
          </Button>
        )}
        {!DOWNLOAD_URL && <Badge variant="secondary">Disponível em breve</Badge>}
        <Button asChild size="sm" variant="outline">
          <a href="/vsfood-print">Como funciona</a>
        </Button>
      </div>
    </div>
  );
}
