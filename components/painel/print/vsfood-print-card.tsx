import { Download, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getVsfoodPrintDownloadUrl, VSFOOD_PRINT_VERSION } from "@/lib/vsfood-print";

/** Card de apresentação/download do app desktop — a lista de dispositivos pareados fica em DevicesCard, logo abaixo. */
export function VsfoodPrintCard() {
  const downloadUrl = getVsfoodPrintDownloadUrl();

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
        {downloadUrl ? (
          <Button asChild size="sm">
            <a href={downloadUrl}>
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
        {!downloadUrl && <Badge variant="secondary">Disponível em breve</Badge>}
        <Button asChild size="sm" variant="outline">
          <a href="/vsfood-print">Como funciona</a>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        v{VSFOOD_PRINT_VERSION} · Compatível com Windows 10 e 11
      </p>
    </div>
  );
}
