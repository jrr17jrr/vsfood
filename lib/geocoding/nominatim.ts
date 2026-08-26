import "server-only";

/**
 * Geocodificação gratuita via Nominatim (OpenStreetMap) — sem chave de API.
 * Uso pontual (busca no mapa do painel, endereço do cliente no checkout),
 * nunca em lote: a política de uso do Nominatim limita a ~1 req/s e exige um
 * User-Agent identificável. Se o serviço falhar ou não achar nada, quem
 * chamar deve tratar como "não foi possível calcular" (nunca assumir uma
 * coordenada arbitrária).
 */
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const USER_AGENT = "VSFood/1.0 (contato via painel do restaurante)";

export type GeocodeResult = { latitude: number; longitude: number; displayName: string };

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(`${NOMINATIM_BASE_URL}/search`);
    url.searchParams.set("q", trimmed);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "br");

    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT }, cache: "no-store" });
    if (!response.ok) return null;

    const results = (await response.json()) as { lat: string; lon: string; display_name: string }[];
    const first = results[0];
    if (!first) return null;

    const latitude = Number(first.lat);
    const longitude = Number(first.lon);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

    return { latitude, longitude, displayName: first.display_name };
  } catch {
    return null;
  }
}
