/**
 * PostgREST serializa colunas `numeric` do Postgres como string em JSON (pra não perder
 * precisão) — mesmo quando o tipo TS do lado do app declara `number`. Sem essa conversão,
 * qualquer `.toFixed()`/cálculo em cima de um valor assim vindo direto do Supabase quebra
 * em runtime (ex: delivery_radius_km, latitude, longitude, fees).
 */
export function toSafeNumber(value: unknown, fallback: number, range?: { min?: number; max?: number }): number {
  let parsed: number;
  if (typeof value === "number") {
    parsed = value;
  } else if (typeof value === "string" && value.trim() !== "") {
    parsed = Number(value);
  } else {
    return fallback;
  }
  if (!Number.isFinite(parsed)) return fallback;
  if (range?.min != null && parsed < range.min) return fallback;
  if (range?.max != null && parsed > range.max) return fallback;
  return parsed;
}

/** Mesma normalização, mas preserva `null` pra campos opcionais em vez de forçar um fallback numérico. */
export function toOptionalSafeNumber(value: unknown, range?: { min?: number; max?: number }): number | null {
  if (value == null) return null;
  const parsed = toSafeNumber(value, NaN, range);
  return Number.isFinite(parsed) ? parsed : null;
}
