"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Printer } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { updateAutoPrintAction } from "@/lib/actions/painel/print";
import type { Restaurant } from "@/types/database";

export function AutoPrintCard({ restaurant, hasDevice }: { restaurant: Restaurant; hasDevice: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(restaurant.auto_print_enabled);
  const [saving, setSaving] = useState(false);

  async function handleChange(value: boolean) {
    setEnabled(value);
    setSaving(true);
    const result = await updateAutoPrintAction(value);
    setSaving(false);
    if (result?.error) {
      toast.error(result.error);
      setEnabled(restaurant.auto_print_enabled);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Printer className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium">Imprimir pedidos automaticamente</p>
          <p className="text-xs text-muted-foreground">
            {hasDevice
              ? "Assim que um pedido chega, o VSFood Print imprime a comanda sozinho."
              : "Conecte um computador com o VSFood Print abaixo pra habilitar."}
          </p>
        </div>
      </div>
      <Switch checked={enabled} disabled={saving || !hasDevice} onCheckedChange={handleChange} />
    </div>
  );
}
