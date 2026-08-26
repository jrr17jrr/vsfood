"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { updateAutoAcceptAction } from "@/lib/actions/painel/orders";
import type { Restaurant } from "@/types/database";

export function AutoAcceptCard({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(restaurant.auto_accept_orders);
  const [saving, setSaving] = useState(false);

  async function handleChange(value: boolean) {
    setEnabled(value);
    setSaving(true);
    const result = await updateAutoAcceptAction(value);
    setSaving(false);
    if (result?.error) {
      toast.error(result.error);
      setEnabled(restaurant.auto_accept_orders);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CheckCircle2 className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium">Aceitar pedidos automaticamente</p>
          <p className="text-xs text-muted-foreground">
            Quando ativado, pedidos válidos entram automaticamente em preparo/confirmado.
          </p>
        </div>
      </div>
      <Switch checked={enabled} disabled={saving} onCheckedChange={handleChange} />
    </div>
  );
}
