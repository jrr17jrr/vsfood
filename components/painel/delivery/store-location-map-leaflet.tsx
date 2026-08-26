"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";

const PIN_ICON = L.divIcon({
  className: "",
  html: `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 26 16 26s16-15 16-26C32 7.163 24.837 0 16 0z" fill="#F0631D"/><circle cx="16" cy="16" r="6" fill="white"/></svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

function RecenterOnChange({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1]]);
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
  const center = useMemo<[number, number]>(() => [latitude, longitude], [latitude, longitude]);

  return (
    <MapContainer center={center} zoom={14} style={{ height: 320, width: "100%", borderRadius: 12 }} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterOnChange center={center} />
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
      {radiusKm != null && radiusKm > 0 && (
        <Circle center={center} radius={radiusKm * 1000} pathOptions={{ color: "#F0631D", fillOpacity: 0.08 }} />
      )}
    </MapContainer>
  );
}
