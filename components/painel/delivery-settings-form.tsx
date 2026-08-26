"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateDeliverySettingsAction } from "@/lib/actions/painel/delivery-zones";
import type { Restaurant } from "@/types/database";

function numberOrNull(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value.replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

export function DeliverySettingsForm({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter();
  const [minOrderValue, setMinOrderValue] = useState(String(restaurant.min_order_value));
  const [estimatedTimeMinutes, setEstimatedTimeMinutes] = useState(String(restaurant.estimated_time_minutes));
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    restaurant.free_shipping_threshold != null ? String(restaurant.free_shipping_threshold) : "",
  );
  const [pickupMinOrderValue, setPickupMinOrderValue] = useState(
    restaurant.pickup_min_order_value != null ? String(restaurant.pickup_min_order_value) : "",
  );
  const [pickupEstimatedTimeMinutes, setPickupEstimatedTimeMinutes] = useState(
    restaurant.pickup_estimated_time_minutes != null ? String(restaurant.pickup_estimated_time_minutes) : "",
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await updateDeliverySettingsAction({
      deliveryEnabled: restaurant.delivery_enabled,
      pickupEnabled: restaurant.pickup_enabled,
      minOrderValue: Number(minOrderValue.replace(",", ".")) || 0,
      estimatedTimeMinutes: Math.trunc(Number(estimatedTimeMinutes)) || 0,
      freeShippingThreshold: numberOrNull(freeShippingThreshold),
      pickupMinOrderValue: numberOrNull(pickupMinOrderValue),
      pickupEstimatedTimeMinutes: pickupEstimatedTimeMinutes.trim() ? Math.trunc(Number(pickupEstimatedTimeMinutes)) : null,
    });
    setSaving(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Configurações de entrega salvas.");
    router.refresh();
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="space-y-3 rounded-2xl border bg-card p-4">
        <p className="text-sm font-semibold">Pedido mínimo</p>
        <div className="space-y-1.5">
          <Label htmlFor="min-order">Entrega (R$)</Label>
          <Input id="min-order" value={minOrderValue} onChange={(e) => setMinOrderValue(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pickup-min-order">Retirada (R$)</Label>
          <Input
            id="pickup-min-order"
            placeholder="Opcional — sem mínimo"
            value={pickupMinOrderValue}
            onChange={(e) => setPickupMinOrderValue(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border bg-card p-4">
        <p className="text-sm font-semibold">Tempo estimado</p>
        <div className="space-y-1.5">
          <Label htmlFor="estimated-time">Entrega (min)</Label>
          <Input id="estimated-time" type="number" min={0} value={estimatedTimeMinutes} onChange={(e) => setEstimatedTimeMinutes(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pickup-estimated-time">Retirada (min)</Label>
          <Input
            id="pickup-estimated-time"
            type="number"
            min={0}
            placeholder="Opcional — usa o tempo de entrega"
            value={pickupEstimatedTimeMinutes}
            onChange={(e) => setPickupEstimatedTimeMinutes(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border bg-card p-4">
        <p className="text-sm font-semibold">Frete grátis</p>
        <div className="space-y-1.5">
          <Label htmlFor="free-shipping">Acima de (R$)</Label>
          <Input
            id="free-shipping"
            placeholder="Opcional — sem regra"
            value={freeShippingThreshold}
            onChange={(e) => setFreeShippingThreshold(e.target.value)}
          />
        </div>
      </div>

      <div className="sm:col-span-3">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </div>
  );
}
