"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateDeliverySettingsAction } from "@/lib/actions/painel/delivery-zones";
import type { Restaurant } from "@/types/database";

function numberOrNull(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value.replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

export function DeliverySettingsForm({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter();
  const [deliveryEnabled, setDeliveryEnabled] = useState(restaurant.delivery_enabled);
  const [pickupEnabled, setPickupEnabled] = useState(restaurant.pickup_enabled);
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
    if (!deliveryEnabled && !pickupEnabled) {
      toast.error("Pelo menos um método (entrega ou retirada) precisa ficar habilitado.");
      return;
    }
    setSaving(true);
    const result = await updateDeliverySettingsAction({
      deliveryEnabled,
      pickupEnabled,
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
    <div className="space-y-6 rounded-2xl border bg-card p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-xl border p-3">
          <div>
            <p className="text-sm font-medium">Entrega habilitada</p>
            <p className="text-xs text-muted-foreground">Clientes podem escolher entrega no checkout.</p>
          </div>
          <Switch checked={deliveryEnabled} onCheckedChange={setDeliveryEnabled} />
        </div>
        <div className="flex items-center justify-between rounded-xl border p-3">
          <div>
            <p className="text-sm font-medium">Retirada habilitada</p>
            <p className="text-xs text-muted-foreground">Clientes podem escolher retirar no local.</p>
          </div>
          <Switch checked={pickupEnabled} onCheckedChange={setPickupEnabled} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="min-order">Pedido mínimo para entrega (R$)</Label>
          <Input id="min-order" value={minOrderValue} onChange={(e) => setMinOrderValue(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="estimated-time">Tempo estimado de entrega (min)</Label>
          <Input id="estimated-time" type="number" min={0} value={estimatedTimeMinutes} onChange={(e) => setEstimatedTimeMinutes(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pickup-min-order">Pedido mínimo para retirada (R$)</Label>
          <Input
            id="pickup-min-order"
            placeholder="Opcional — sem mínimo"
            value={pickupMinOrderValue}
            onChange={(e) => setPickupMinOrderValue(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pickup-estimated-time">Tempo estimado de retirada (min)</Label>
          <Input
            id="pickup-estimated-time"
            type="number"
            min={0}
            placeholder="Opcional — usa o tempo de entrega"
            value={pickupEstimatedTimeMinutes}
            onChange={(e) => setPickupEstimatedTimeMinutes(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="free-shipping">Frete grátis acima de (R$)</Label>
          <Input
            id="free-shipping"
            placeholder="Opcional — sem regra de frete grátis"
            value={freeShippingThreshold}
            onChange={(e) => setFreeShippingThreshold(e.target.value)}
          />
        </div>
      </div>

      <Button type="button" onClick={handleSave} disabled={saving}>
        {saving ? "Salvando..." : "Salvar configurações"}
      </Button>
    </div>
  );
}
