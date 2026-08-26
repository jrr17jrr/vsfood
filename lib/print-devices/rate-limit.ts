import "server-only";

/**
 * Rate limit best-effort, em memória do processo — reseta a cada cold start
 * e não é compartilhado entre instâncias/regiões da Vercel. Suficiente pra V1
 * porque o código de pareamento já expira em minutos e é de uso único
 * (ver print_pairing_codes); se precisar de algo robusto entre instâncias,
 * trocar por um contador no Postgres ou Upstash/Vercel KV.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
