import { randomBytes, randomInt, createHash } from "crypto";

/**
 * Hash determinístico (sha-256) — nunca guardamos código/token em texto puro.
 * Determinístico (em vez de bcrypt) de propósito: precisamos fazer
 * `where code_hash = $1` / `where token_hash = $1` direto no banco, sem
 * varrer linha a linha comparando um segredo de baixa entropia (código de
 * 6 dígitos) ou alta entropia (token de dispositivo) contra cada hash salgado.
 */
export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

/** Código de pareamento curto, ex: "482917" — exibido ao dono como "482 917". */
export function generatePairingCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function formatPairingCode(code: string): string {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

/** Remove espaços/traços que o usuário pode digitar ao colar o código. */
export function normalizePairingCode(input: string): string {
  return input.replace(/\D/g, "");
}

/** Token de dispositivo — alta entropia, opaco, só existe em texto puro no momento da troca do código. */
export function generateDeviceToken(): string {
  return `vsfp_${randomBytes(32).toString("base64url")}`;
}
