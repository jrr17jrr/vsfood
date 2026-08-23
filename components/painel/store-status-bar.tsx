"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RestaurantStatusBadge } from "@/components/shared/restaurant-status-badge";
import { getAccessDescriptor } from "@/lib/restaurant-status";
import { toggleOrdersPausedAction } from "@/lib/actions/painel/settings";
import type { Restaurant } from "@/types/database";

export function StoreStatusBar({ restaurant, planName }: { restaurant: Restaurant; planName: string | null }) {
  const router = useRouter();
  const [paused, setPaused] = useState(restaurant.orders_paused);
  const [loading, setLoading] = useState(false);
  const descriptor = getAccessDescriptor(restaurant, planName);

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
    <div className="border-b bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <RestaurantStatusBadge descriptor={descriptor} />
        <label className="flex items-center gap-2 text-sm font-medium">
          Pausar pedidos
          <Switch checked={paused} disabled={loading} onCheckedChange={handleToggle} />
        </label>
      </div>
      {descriptor.kind === "trial" && descriptor.expired && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-destructive/5 px-4 py-3 text-sm sm:px-6">
          <p className="text-destructive">Seu período de teste terminou.</p>
          <Button asChild size="sm" variant="outline">
            <Link href="/cadastro?tipo=restaurante">Falar com o VSFood</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
