import "server-only";

import { cookies } from "next/headers";

/**
 * "Modo Admin": cookie httpOnly guardando qual restaurante um admin está
 * visualizando/editando pelo /painel — NUNCA é a fronteira de segurança (isso
 * continua sendo a RLS/`is_admin()`, que já permite admin em qualquer loja).
 * É só roteamento: sem ele, `requireRestaurantMembership()` não sabe qual
 * restaurante usar para um usuário que não tem `restaurant_users` próprio.
 * Nunca toca em role/app_metadata/sessão do Supabase.
 */
const ADMIN_VIEW_COOKIE = "vsfood_admin_view_restaurant";
const ADMIN_VIEW_MAX_AGE = 60 * 60 * 4; // 4h — evita ficar "preso" indefinidamente no modo admin.

export async function getAdminViewRestaurantId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_VIEW_COOKIE)?.value ?? null;
}

export async function setAdminViewCookie(restaurantId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_VIEW_COOKIE, restaurantId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_VIEW_MAX_AGE,
  });
}

export async function clearAdminViewCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_VIEW_COOKIE);
}
