"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { updateChargeModeAction, updateStoreLocationAction } from "@/lib/actions/painel/delivery-zones";
import { StoreLocationMap } from "./store-location-map";
import { DeliveryChargeModePicker } from "./delivery-charge-mode-picker";
import { DeliveryZonesManager } from "@/components/painel/delivery-zones-manager";
import type { DeliveryDistanceTier, DeliveryZone, Restaurant } from "@/types/database";

const DEFAULT_LATITUDE = -22.9068; // Rio de Janeiro — só um ponto de partida quando a loja nunca definiu localização.
const DEFAULT_LONGITUDE = -43.1729;

type AreaType = "radius" | "neighborhood";

export function DeliveryAreaPicker({
  restaurant,
  zones,
  tiers,
}: {
  restaurant: Restaurant;
  zones: DeliveryZone[];
  tiers: DeliveryDistanceTier[];
}) {
  const router = useRouter();
  const [areaType, setAreaType] = useState<AreaType>(restaurant.delivery_charge_mode === "neighborhood" ? "neighborhood" : "radius");
  const [switching, setSwitching] = useState(false);

  const [lat, setLat] = useState(restaurant.latitude ?? DEFAULT_LATITUDE);
  const [lng, setLng] = useState(restaurant.longitude ?? DEFAULT_LONGITUDE);
  const [radiusKm, setRadiusKm] = useState(restaurant.delivery_radius_km ?? 8);
  const [savingLocation, setSavingLocation] = useState(false);

  async function handleAreaTypeChange(next: AreaType) {
    setAreaType(next);
    if (next !== "neighborhood") return;
    setSwitching(true);
    const result = await updateChargeModeAction({ mode: "neighborhood", baseFee: null, feePerKm: null });
    setSwitching(false);
    if (result?.error) toast.error(result.error);
    router.refresh();
  }

  async function handleSaveLocation() {
    setSavingLocation(true);
    const results = await Promise.all([
      updateStoreLocationAction({ latitude: lat, longitude: lng, deliveryRadiusKm: radiusKm }),
      restaurant.delivery_charge_mode === "neighborhood"
        ? updateChargeModeAction({ mode: "fixed", baseFee: null, feePerKm: null })
        : Promise.resolve({} as { error?: string }),
    ]);
    setSavingLocation(false);
    const error = results.find((r) => r?.error)?.error;
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Localização e raio de entrega salvos.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-4 sm:p-5">
        <p className="text-sm font-semibold">Área de entrega</p>
        <RadioGroup
          value={areaType}
          onValueChange={(v) => handleAreaTypeChange(v as AreaType)}
          className="mt-3 grid gap-3 sm:grid-cols-2"
        >
          <Label className="flex cursor-pointer flex-col gap-1 rounded-xl border p-4 has-[[data-state=checked]]:border-primary">
            <RadioGroupItem value="radius" disabled={switching} className="mb-1" />
            <span className="font-medium">Por raio</span>
            <span className="text-xs text-muted-foreground">Define um raio de entrega a partir da localização da loja no mapa.</span>
          </Label>
          <Label className="flex cursor-pointer flex-col gap-1 rounded-xl border p-4 has-[[data-state=checked]]:border-primary">
            <RadioGroupItem value="neighborhood" disabled={switching} className="mb-1" />
            <span className="font-medium">Por bairros</span>
            <span className="text-xs text-muted-foreground">Lista de bairros com taxa própria (UF + cidade + bairro).</span>
          </Label>
        </RadioGroup>
      </div>

      {areaType === "radius" ? (
        <>
          <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5">
            <p className="text-sm font-semibold">Localização da loja e raio de entrega</p>
            <StoreLocationMap
              latitude={lat}
              longitude={lng}
              radiusKm={radiusKm}
              onChange={(newLat, newLng) => {
                setLat(newLat);
                setLng(newLng);
              }}
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <Label htmlFor="radius-slider">Raio de entrega</Label>
                <span className="font-medium">{radiusKm.toFixed(1)} km</span>
              </div>
              <input
                id="radius-slider"
                type="range"
                min={1}
                max={30}
                step={0.5}
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 km</span>
                <span>30 km</span>
              </div>
            </div>
            <Button type="button" onClick={handleSaveLocation} disabled={savingLocation}>
              {savingLocation ? "Salvando..." : "Salvar localização e raio"}
            </Button>
          </div>

          <DeliveryChargeModePicker restaurant={restaurant} tiers={tiers} />
        </>
      ) : (
        <div className="rounded-2xl border bg-card p-4 sm:p-5">
          <p className="mb-1 text-sm font-semibold">Bairros atendidos</p>
          <p className="mb-3 text-sm text-muted-foreground">
            Defina a taxa por UF + cidade + bairro. Pedido mínimo e tempo estimado por região são opcionais — quando
            vazios, usam a configuração geral.
          </p>
          <DeliveryZonesManager zones={zones} />
        </div>
      )}
    </div>
  );
}
