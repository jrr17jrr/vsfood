"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toggleOrdersPausedAction } from "@/lib/actions/painel/settings";
import type { Restaurant } from "@/types/database";

export function StoreStatusBar({ restaurant, trialDaysLeft }: { restaurant: Restaurant; trialDaysLeft: number | null }) {
  const router = useRouter();
  const [paused, setPaused] = useState(restaurant.orders_paused);
  const [loading, setLoading] = useState(false);

  async function handleToggle(checked: boolean) {
    setLoading(true);
    setPaused(checked);
    const result = await toggleOrdersPausedAction(checked);
    setLoading(false);
    if (result?.error) {
      setPaused(!checked);
      toast.error(result.error);
      return;
    }
    toast.success(checked ? "Pedidos pausados." : "Pedidos retomados.");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-3 sm:px-6">
      <div className="flex items-center gap-2">
        {trialDaysLeft !== null && (
          <Badge variant="secondary">
            {trialDaysLeft > 0 ? `Seu teste termina em ${trialDaysLeft} dia${trialDaysLeft === 1 ? "" : "s"}` : "Teste expirado"}
          </Badge>
        )}
        {restaurant.status === "suspended" && <Badge variant="destructive">Loja suspensa</Badge>}
      </div>
      <label className="flex items-center gap-2 text-sm font-medium">
        Pausar pedidos
        <Switch checked={paused} disabled={loading} onCheckedChange={handleToggle} />
      </label>
    </div>
  );
}
