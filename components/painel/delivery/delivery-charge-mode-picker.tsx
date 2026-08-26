"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { updateChargeModeAction } from "@/lib/actions/painel/delivery-zones";
import { DistanceTiersManager } from "./distance-tiers-manager";
import { DeliveryZonesManager } from "@/components/painel/delivery-zones-manager";
import type { DeliveryChargeMode, DeliveryDistanceTier, DeliveryZone, Restaurant } from "@/types/database";

export function DeliveryChargeModePicker({
  restaurant,
  zones,
  tiers,
}: {
  restaurant: Restaurant;
  zones: DeliveryZone[];
  tiers: DeliveryDistanceTier[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<DeliveryChargeMode>(restaurant.delivery_charge_mode);
  const [baseFee, setBaseFee] = useState(restaurant.delivery_base_fee != null ? String(restaurant.delivery_base_fee) : "");
  const [feePerKm, setFeePerKm] = useState(restaurant.delivery_fee_per_km != null ? String(restaurant.delivery_fee_per_km) : "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await updateChargeModeAction({
      mode,
      baseFee: mode === "fixed" || mode === "per_km" ? (baseFee.trim() ? Number(baseFee.replace(",", ".")) || 0 : null) : null,
      feePerKm: mode === "per_km" ? (feePerKm.trim() ? Number(feePerKm.replace(",", ".")) || 0 : null) : null,
    });
    setSaving(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Forma de cobrança salva.");
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5">
      <div>
        <p className="text-sm font-semibold">Como você quer cobrar a entrega?</p>
        <RadioGroup value={mode} onValueChange={(v) => setMode(v as DeliveryChargeMode)} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Label className="flex cursor-pointer flex-col gap-1 rounded-xl border p-4 has-[[data-state=checked]]:border-primary">
            <RadioGroupItem value="fixed" className="mb-1" />
            <span className="font-medium">Taxa fixa</span>
            <span className="text-xs text-muted-foreground">Mesmo valor pra qualquer endereço dentro do raio.</span>
          </Label>
          <Label className="flex cursor-pointer flex-col gap-1 rounded-xl border p-4 has-[[data-state=checked]]:border-primary">
            <RadioGroupItem value="per_km" className="mb-1" />
            <span className="font-medium">Por km</span>
            <span className="text-xs text-muted-foreground">Taxa base + valor por km rodado.</span>
          </Label>
          <Label className="flex cursor-pointer flex-col gap-1 rounded-xl border p-4 has-[[data-state=checked]]:border-primary">
            <RadioGroupItem value="tiered" className="mb-1" />
            <span className="font-medium">Por faixas</span>
            <span className="text-xs text-muted-foreground">Ex: até 3km R$4, até 6km R$7.</span>
          </Label>
          <Label className="flex cursor-pointer flex-col gap-1 rounded-xl border p-4 has-[[data-state=checked]]:border-primary">
            <RadioGroupItem value="neighborhood" className="mb-1" />
            <span className="font-medium">Por bairros/regiões</span>
            <span className="text-xs text-muted-foreground">Taxa própria por UF + cidade + bairro.</span>
          </Label>
        </RadioGroup>
      </div>

      {(mode === "fixed" || mode === "per_km" || mode === "tiered") && (
        <p className="text-xs text-muted-foreground">
          Essa forma de cobrança usa o raio definido acima — confira se a localização e o raio já estão salvos.
        </p>
      )}

      {mode === "fixed" && (
        <div className="max-w-56 space-y-1.5">
          <Label htmlFor="base-fee">Taxa fixa (R$)</Label>
          <Input id="base-fee" placeholder="Ex: 7,00" value={baseFee} onChange={(e) => setBaseFee(e.target.value)} />
        </div>
      )}

      {mode === "per_km" && (
        <div className="grid max-w-md grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="base-fee-km">Taxa base (R$)</Label>
            <Input id="base-fee-km" placeholder="Ex: 4,00" value={baseFee} onChange={(e) => setBaseFee(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fee-per-km">Por km (R$)</Label>
            <Input id="fee-per-km" placeholder="Ex: 1,50" value={feePerKm} onChange={(e) => setFeePerKm(e.target.value)} />
          </div>
        </div>
      )}

      {mode === "tiered" && <DistanceTiersManager tiers={tiers} />}

      <div>
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar forma de cobrança"}
        </Button>
        {mode === "neighborhood" && restaurant.delivery_charge_mode !== "neighborhood" && (
          <p className="mt-2 text-xs text-muted-foreground">
            Clique em salvar pra ativar a cobrança por bairros — as regiões abaixo podem ser cadastradas antes ou
            depois.
          </p>
        )}
      </div>

      {mode === "neighborhood" && (
        <div className="border-t pt-4">
          <p className="mb-1 text-sm font-medium">Bairros atendidos</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Defina a taxa por UF + cidade + bairro. Pedido mínimo e tempo estimado por região são opcionais — quando
            vazios, usam a configuração geral.
          </p>
          <DeliveryZonesManager zones={zones} />
        </div>
      )}
    </div>
  );
}
