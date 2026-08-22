import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Client autenticado com a sessão do usuário atual (respeita RLS).
 * Uso: Server Components, Server Actions, Route Handlers.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // set() chamado a partir de um Server Component: ignorado, pois o
            // middleware já cuida do refresh de sessão nesses casos.
          }
        },
      },
    },
  );
}

/**
 * Client com a service role, ignora RLS por completo.
 * Uso EXCLUSIVO em código server-only e sensível: criação/recálculo de
 * pedidos, integração com Mercado Pago, webhook, painel DEV.
 * Nunca importar este módulo de um componente/arquivo que rode no client.
 */
export function createServiceRoleClient() {
  return createSupabaseJsClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
