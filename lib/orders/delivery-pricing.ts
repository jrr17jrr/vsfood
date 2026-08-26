import "server-only";

import { normalizeText } from "@/lib/text";
import type { DeliveryDistanceTier, DeliveryZone, Restaurant } from "@/types/database";

/** Distância em linha reta entre dois pontos (fórmula de Haversine), em km. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export type ZoneMatchAddress = { state: string | null; city: string | null; neighborhood: string };

/**
 * Zonas com state/city preenchidos exigem os três campos batendo
 * (normalizados). Zonas legadas (criadas antes desta evolução, sem
 * state/city) continuam casando só pelo bairro — compatibilidade com dado
 * existente, sem exigir backfill.
 */
export function matchNeighborhoodZone(zones: DeliveryZone[], address: ZoneMatchAddress): DeliveryZone | null {
  const neighborhood = normalizeText(address.neighborhood);
  const state = address.state ? normalizeText(address.state) : "";
  const city = address.city ? normalizeText(address.city) : "";

  return (
    zones.find((z) => {
      if (normalizeText(z.neighborhood) !== neighborhood) return false;
      if (z.state && z.city) return normalizeText(z.state) === state && normalizeText(z.city) === city;
      return true;
    }) ?? null
  );
}

export type DeliveryQuote =
  | { eligible: true; fee: number; distanceKm: number | null; estimatedTimeMinutes: number | null; matchedZone: DeliveryZone | null }
  | { eligible: false; reason: string };

export type QuoteAddress = ZoneMatchAddress & { latitude: number | null; longitude: number | null };

/**
 * Único ponto de verdade pra elegibilidade + taxa + distância + tempo
 * estimado, conforme `restaurants.delivery_charge_mode`. Usado tanto pelo
 * preview do checkout quanto por createOrderAction — nunca confia em taxa ou
 * distância calculada no client.
 */
export function resolveDeliveryQuote(
  restaurant: Restaurant,
  zones: DeliveryZone[],
  tiers: DeliveryDistanceTier[],
  address: QuoteAddress,
): DeliveryQuote {
  if (restaurant.delivery_charge_mode === "neighborhood") {
    const zone = matchNeighborhoodZone(zones, address);
    if (zones.length === 0) {
      return { eligible: true, fee: 0, distanceKm: null, estimatedTimeMinutes: restaurant.estimated_time_minutes, matchedZone: null };
    }
    if (!zone) return { eligible: false, reason: "Não entregamos nesse bairro." };
    return {
      eligible: true,
      fee: zone.fee,
      distanceKm: null,
      estimatedTimeMinutes: zone.estimated_time_minutes ?? restaurant.estimated_time_minutes,
      matchedZone: zone,
    };
  }

  if (restaurant.latitude == null || restaurant.longitude == null || restaurant.delivery_radius_km == null) {
    return { eligible: false, reason: "Esta loja ainda não configurou a área de entrega." };
  }
  if (address.latitude == null || address.longitude == null) {
    return { eligible: false, reason: "Não foi possível localizar este endereço no mapa." };
  }

  const distanceKm = haversineKm(restaurant.latitude, restaurant.longitude, address.latitude, address.longitude);
  if (distanceKm > restaurant.delivery_radius_km) {
    return { eligible: false, reason: "Este endereço está fora da área de entrega desta loja." };
  }

  let fee: number;
  if (restaurant.delivery_charge_mode === "fixed") {
    fee = restaurant.delivery_base_fee ?? 0;
  } else if (restaurant.delivery_charge_mode === "per_km") {
    fee = (restaurant.delivery_base_fee ?? 0) + (restaurant.delivery_fee_per_km ?? 0) * distanceKm;
  } else {
    const sortedTiers = [...tiers].sort((a, b) => a.max_distance_km - b.max_distance_km);
    const tier = sortedTiers.find((t) => distanceKm <= t.max_distance_km);
    if (!tier) return { eligible: false, reason: "Este endereço está fora da área de entrega desta loja." };
    fee = tier.fee;
  }

  return {
    eligible: true,
    fee: Math.round(fee * 100) / 100,
    distanceKm: Math.round(distanceKm * 10) / 10,
    estimatedTimeMinutes: restaurant.estimated_time_minutes,
    matchedZone: null,
  };
}
