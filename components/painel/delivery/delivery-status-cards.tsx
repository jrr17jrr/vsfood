"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bike, Store } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { updatePauseStateAction } from "@/lib/actions/painel/delivery-zones";
import type { Restaurant } from "@/types/database";

export function DeliveryStatusCards({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter();
  const [deliveryEnabled, setDeliveryEnabled] = useState(restaurant.delivery_enabled);
  const [pickupEnabled, setPickupEnabled] = useState(restaurant.pickup_enabled);
  const [saving, setSaving] = useState(false);

  async function toggle(next: { deliveryEnabled: boolean; pickupEnabled: boolean }) {
    setSaving(true);
    const result = await updatePauseStateAction(next);
    setSaving(false);
    if (result?.error) {
      toast.error(result.error);
      setDeliveryEnabled(restaurant.delivery_enabled);
      setPickupEnabled(restaurant.pickup_enabled);
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bike className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Status da entrega</p>
            <p className="text-xs text-muted-foreground">
              {deliveryEnabled ? "Aceitando pedidos para entrega" : "Entregas pausadas"}
            </p>
          </div>
        </div>
        <Switch
          checked={deliveryEnabled}
          disabled={saving}
          onCheckedChange={(v) => {
            setDeliveryEnabled(v);
            toggle({ deliveryEnabled: v, pickupEnabled });
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Store className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Status da retirada</p>
            <p className="text-xs text-muted-foreground">
              {pickupEnabled ? "Aceitando pedidos para retirada" : "Retirada pausada"}
            </p>
          </div>
        </div>
        <Switch
          checked={pickupEnabled}
          disabled={saving}
          onCheckedChange={(v) => {
            setPickupEnabled(v);
            toggle({ deliveryEnabled, pickupEnabled: v });
          }}
        />
      </div>
    </div>
  );
}
