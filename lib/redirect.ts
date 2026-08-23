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

/**
 * Página inicial padrão pós-login por role. Usada sempre que não há um
 * `redirect` explícito, ou quando ele não é permitido para a role (ver
 * `isRedirectAllowedForRole`).
 */
export function roleHomePath(role: string | null | undefined): string {
  if (role === "admin") return "/admin";
  if (role === "restaurant_owner") return "/painel";
  return "/minha-conta";
}

/**
 * Evita que um `redirect` explícito (query param `redirect`/`next` do login)
 * mande um usuário para uma área de outra role — ex: um `restaurant_owner`
 * sendo mandado para `/painel` de propósito não é problema, mas nunca deveria
 * cair em `/admin`, e vice-versa. Áreas neutras (`/minha-conta`, `/checkout`,
 * `/pedido/*`, `/recuperar-senha/*`, etc.) continuam liberadas para qualquer
 * role autenticada, porque já são compartilhadas por design hoje.
 */
export function isRedirectAllowedForRole(path: string, role: string | null | undefined): boolean {
  if (path.startsWith("/admin")) return role === "admin";
  if (path.startsWith("/painel")) return role === "restaurant_owner" || role === "admin";
  return true;
}
