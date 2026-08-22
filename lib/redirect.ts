/**
 * Valida um caminho de redirecionamento pós-login (query param `redirect`/`next`)
 * para evitar open redirect: só aceita caminhos internos, relativos, começando
 * com uma única barra (nunca "//host", "https://host" ou similares).
 */
export function getSafeRedirectPath(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("://")) return fallback;
  return value;
}
