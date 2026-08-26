"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import { toSafeNumber } from "@/lib/numeric";

// Mesmo fallback de components/painel/delivery/delivery-area-picker.tsx — duplicado aqui
// (em vez de importado) pra não criar um ciclo com o import dinâmico ssr:false daquele arquivo.
const FALLBACK_LATITUDE = -22.9068;
const FALLBACK_LONGITUDE = -43.1729;

const PIN_ICON = L.divIcon({
  className: "",
  html: `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 26 16 26s16-15 16-26C32 7.163 24.837 0 16 0z" fill="#F0631D"/><circle cx="16" cy="16" r="6" fill="white"/></svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

/** Ajusta o zoom automaticamente pra sempre mostrar o círculo inteiro (estilo seleção de raio do Meta Ads). */
function FitToCircle({ center, radiusKm }: { center: [number, number]; radiusKm: number | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // whenReady só dispara a callback depois que o mapa tem instância e tamanho prontos
    // (chama na hora se já estiver pronto) — fitBounds/setView nunca rodam antes disso.
    map.whenReady(() => {
      const hasValidRadius = radiusKm != null && Number.isFinite(radiusKm) && radiusKm > 0;
      if (!hasValidRadius) {
        map.setView(center, 14);
        return;
      }

      // Nunca usar L.circle(...).getBounds() aqui: um Circle criado fora do mapa nunca é
      // projetado (this._map/this._point continuam undefined), e getBounds() quebra com
      // "Cannot read properties of undefined (reading 'layerPointToLatLng')". O bounding
      // box é calculado direto a partir de lat/lng + raio (LatLng.toBounds), sem depender
      // de nenhuma camada estar montada no mapa.
      const bounds = L.latLng(center).toBounds(radiusKm * 1000 * 2);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [24, 24] });
      } else {
        map.setView(center, 14);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, center[0], center[1], radiusKm]);

  return null;
}

function RecenterOnClick({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function StoreLocationMapLeaflet({
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
  const markerRef = useRef<L.Marker>(null);
  const safeLatitude = toSafeNumber(latitude, FALLBACK_LATITUDE, { min: -90, max: 90 });
  const safeLongitude = toSafeNumber(longitude, FALLBACK_LONGITUDE, { min: -180, max: 180 });
  const safeRadiusKm = radiusKm != null ? toSafeNumber(radiusKm, 0, { min: 0.01 }) || null : null;
  const center = useMemo<[number, number]>(() => [safeLatitude, safeLongitude], [safeLatitude, safeLongitude]);

  return (
    <MapContainer center={center} zoom={14} style={{ height: 320, width: "100%", borderRadius: 12 }} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToCircle center={center} radiusKm={safeRadiusKm} />
      <RecenterOnClick onChange={onChange} />
      <Marker
        position={center}
        icon={PIN_ICON}
        draggable
        ref={markerRef}
        eventHandlers={{
          dragend: () => {
            const marker = markerRef.current;
            if (!marker) return;
            const pos = marker.getLatLng();
            onChange(pos.lat, pos.lng);
          },
        }}
      />
      {safeRadiusKm != null && (
        <Circle center={center} radius={safeRadiusKm * 1000} pathOptions={{ color: "#F0631D", fillOpacity: 0.08 }} />
      )}
    </MapContainer>
  );
}
