import "server-only";

import { MercadoPagoConfig, OAuth } from "mercadopago";

export function getPlatformCredentials() {
  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
  const redirectUri = process.env.MERCADOPAGO_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Credenciais do Mercado Pago não configuradas (MERCADOPAGO_CLIENT_ID/SECRET/REDIRECT_URI em .env.local).",
    );
  }

  return { clientId, clientSecret, redirectUri };
}

// Config "vazio" (sem access token de restaurante) usado apenas para o fluxo OAuth,
// que só precisa do client_id/client_secret da aplicação.
export function getPlatformOAuthClient(): OAuth {
  const { clientId } = getPlatformCredentials();
  const config = new MercadoPagoConfig({ accessToken: clientId });
  return new OAuth(config);
}

// Config autenticado com o access_token do RESTAURANTE (nunca da plataforma) —
// todo pagamento é criado em nome da conta Mercado Pago do próprio restaurante.
export function getRestaurantConfig(accessToken: string): MercadoPagoConfig {
  return new MercadoPagoConfig({ accessToken });
}
