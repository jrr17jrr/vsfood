import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireRestaurantMembership } from "@/lib/auth";
import { getPlatformCredentials, getPlatformOAuthClient } from "@/lib/mercadopago/client";

const NONCE_COOKIE = "mp_oauth_nonce";

export async function GET() {
  const { restaurantId } = await requireRestaurantMembership();

  let clientId: string;
  let redirectUri: string;
  try {
    ({ clientId, redirectUri } = getPlatformCredentials());
  } catch {
    const url = new URL("/painel/pagamentos", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
    url.searchParams.set("error", "config");
    return NextResponse.redirect(url);
  }

  const nonce = randomBytes(16).toString("hex");
  const state = `${restaurantId}.${nonce}`;

  const oauth = getPlatformOAuthClient();
  const authorizationUrl = oauth.getAuthorizationURL({
    options: { client_id: clientId, redirect_uri: redirectUri, state },
  });

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(NONCE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
