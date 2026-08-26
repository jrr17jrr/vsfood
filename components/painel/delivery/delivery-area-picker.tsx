"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateStoreLocationAction } from "@/lib/actions/painel/delivery-zones";
import { StoreLocationMap } from "./store-location-map";
import { DeliveryChargeModePicker } from "./delivery-charge-mode-picker";
import type { DeliveryDistanceTier, DeliveryZone, Restaurant } from "@/types/database";

const DEFAULT_LATITUDE = -22.9068; // Rio de Janeiro — só um ponto de partida quando a loja nunca definiu localização.
const DEFAULT_LONGITUDE = -43.1729;

/**
 * Mapa e raio ficam sempre visíveis, independente da forma de cobrança
 * escolhida abaixo — servem pro dono visualizar onde está a loja e o alcance
 * de entrega mesmo em quem cobra por bairro. Antes disso o mapa só aparecia
 * quando o dono escolhia explicitamente "por raio" num toggle separado, e
 * como `delivery_charge_mode` nasce como 'neighborhood' por padrão pra toda
 * loja nova, o mapa nunca chegava a renderizar na prática.
 */
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
  const [lat, setLat] = useState(restaurant.latitude ?? DEFAULT_LATITUDE);
  const [lng, setLng] = useState(restaurant.longitude ?? DEFAULT_LONGITUDE);
  const [radiusKm, setRadiusKm] = useState(restaurant.delivery_radius_km ?? 8);
  const [savingLocation, setSavingLocation] = useState(false);

  async function handleSaveLocation() {
    setSavingLocation(true);
    const result = await updateStoreLocationAction({ latitude: lat, longitude: lng, deliveryRadiusKm: radiusKm });
    setSavingLocation(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Localização e raio de entrega salvos.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5">
        <div>
          <p className="text-sm font-semibold">Localização do restaurante</p>
          <p className="text-xs text-muted-foreground">Busque o endereço ou arraste o pino pra ajustar a posição exata.</p>
        </div>
        <StoreLocationMap
          latitude={lat}
          longitude={lng}
          radiusKm={radiusKm}
          onChange={(newLat, newLng) => {
            setLat(newLat);
            setLng(newLng);
          }}
        />

        <div className="space-y-2 border-t pt-4">
          <p className="text-sm font-semibold">Raio de entrega</p>
          <div className="flex items-center justify-between text-sm">
            <Label htmlFor="radius-slider">Raio atual</Label>
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

      <DeliveryChargeModePicker restaurant={restaurant} zones={zones} tiers={tiers} />
    </div>
  );
}
