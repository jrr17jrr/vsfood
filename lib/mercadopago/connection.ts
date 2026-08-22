import "server-only";

import { type OAuth } from "mercadopago";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { encryptSecret, decryptSecret } from "./crypto";
import { getPlatformCredentials, getPlatformOAuthClient } from "./client";

type OAuthResponse = Awaited<ReturnType<OAuth["create"]>>;

export async function saveConnectionFromOAuth(restaurantId: string, tokens: OAuthResponse): Promise<void> {
  if (!tokens.access_token || !tokens.refresh_token || !tokens.public_key || !tokens.user_id) {
    throw new Error("Resposta de OAuth do Mercado Pago incompleta.");
  }

  const db = createServiceRoleClient();
  const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 15552000) * 1000).toISOString();

  await db.from("mercadopago_connections").upsert(
    {
      restaurant_id: restaurantId,
      mp_user_id: String(tokens.user_id),
      access_token_encrypted: encryptSecret(tokens.access_token),
      refresh_token_encrypted: encryptSecret(tokens.refresh_token),
      public_key: tokens.public_key,
      expires_at: expiresAt,
      connected_at: new Date().toISOString(),
      status: "connected",
    },
    { onConflict: "restaurant_id" },
  );
}

export async function disconnectRestaurant(restaurantId: string): Promise<void> {
  const db = createServiceRoleClient();
  await db.from("mercadopago_connections").delete().eq("restaurant_id", restaurantId);
}

export type ConnectionStatus = {
  connected: boolean;
  publicKey: string | null;
  connectedAt: string | null;
};

export async function getConnectionStatus(restaurantId: string): Promise<ConnectionStatus> {
  const db = createServiceRoleClient();
  const { data } = await db
    .from("mercadopago_connections")
    .select("public_key, connected_at, status")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (!data || data.status !== "connected") return { connected: false, publicKey: null, connectedAt: null };
  return { connected: true, publicKey: data.public_key, connectedAt: data.connected_at };
}

/**
 * Retorna um access_token válido para o restaurante, renovando via refresh_token
 * automaticamente quando estiver perto de expirar. Nunca expõe o token ao client.
 */
export async function getValidAccessToken(restaurantId: string): Promise<string | null> {
  const db = createServiceRoleClient();
  const { data } = await db
    .from("mercadopago_connections")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (!data || data.status !== "connected" || !data.access_token_encrypted || !data.refresh_token_encrypted) {
    return null;
  }

  const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : 0;
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (expiresAt - Date.now() > oneDayMs) {
    return decryptSecret(data.access_token_encrypted);
  }

  try {
    const { clientId, clientSecret } = getPlatformCredentials();
    const oauth: OAuth = getPlatformOAuthClient();
    const refreshed = await oauth.refresh({
      body: {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: decryptSecret(data.refresh_token_encrypted),
      },
    });

    if (!refreshed.access_token || !refreshed.refresh_token) return decryptSecret(data.access_token_encrypted);

    const newExpiresAt = new Date(Date.now() + (refreshed.expires_in ?? 15552000) * 1000).toISOString();
    await db
      .from("mercadopago_connections")
      .update({
        access_token_encrypted: encryptSecret(refreshed.access_token),
        refresh_token_encrypted: encryptSecret(refreshed.refresh_token),
        expires_at: newExpiresAt,
      })
      .eq("restaurant_id", restaurantId);

    return refreshed.access_token;
  } catch {
    // refresh falhou: usa o token atual (pode ainda estar válido) em vez de derrubar o checkout.
    return decryptSecret(data.access_token_encrypted);
  }
}
