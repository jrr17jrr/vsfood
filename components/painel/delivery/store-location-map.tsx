"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchAddressAction } from "@/lib/actions/painel/delivery-zones";

const StoreLocationMapLeaflet = dynamic(
  () => import("./store-location-map-leaflet").then((mod) => mod.StoreLocationMapLeaflet),
  { ssr: false, loading: () => <div className="flex h-80 items-center justify-center rounded-xl border bg-muted text-sm text-muted-foreground">Carregando mapa...</div> },
);

export function StoreLocationMap({
  latitude,
  longitude,
  radiusKm,
  onChange,
}: {
  latitude: number;
  longitude: number;
  radiusKm: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setNotFound(false);
    const result = await searchAddressAction(query);
    setSearching(false);
    if (!result) {
      setNotFound(true);
      return;
    }
    onChange(result.latitude, result.longitude);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Buscar endereço da loja..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={handleSearch} disabled={searching}>
          <Search className="size-4" />
        </Button>
      </div>
      {notFound && <p className="text-xs text-destructive">Endereço não encontrado. Ajuste o pino manualmente no mapa.</p>}
      <StoreLocationMapLeaflet latitude={latitude} longitude={longitude} radiusKm={radiusKm} onChange={onChange} />
      <p className="text-xs text-muted-foreground">Arraste o pino ou clique no mapa pra ajustar a localização exata da loja.</p>
    </div>
  );
}
