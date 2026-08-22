import { NextResponse, type NextRequest } from "next/server";
import { requireRestaurantMembership } from "@/lib/auth";
import { getPlatformCredentials, getPlatformOAuthClient } from "@/lib/mercadopago/client";
import { saveConnectionFromOAuth } from "@/lib/mercadopago/connection";

const NONCE_COOKIE = "mp_oauth_nonce";

function redirectToPagamentos(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/painel/pagamentos", request.url);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = NextResponse.redirect(url);
  response.cookies.delete(NONCE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const { restaurantId } = await requireRestaurantMembership();

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const nonceCookie = request.cookies.get(NONCE_COOKIE)?.value;

  if (!code || !state || !nonceCookie) {
    return redirectToPagamentos(request, { error: "oauth" });
  }

  const [stateRestaurantId, stateNonce] = state.split(".");
  if (stateNonce !== nonceCookie || stateRestaurantId !== restaurantId) {
    return redirectToPagamentos(request, { error: "oauth" });
  }

  try {
    const { clientId, clientSecret, redirectUri } = getPlatformCredentials();
    const oauth = getPlatformOAuthClient();
    const tokens = await oauth.create({
      body: { client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri },
    });

    await saveConnectionFromOAuth(restaurantId, tokens);
  } catch {
    return redirectToPagamentos(request, { error: "oauth" });
  }

  return redirectToPagamentos(request, { connected: "1" });
}
