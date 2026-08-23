import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath, isRedirectAllowedForRole, roleHomePath } from "@/lib/redirect";

/**
 * Callback único para todo fluxo de autenticação baseado em link/redirect:
 * confirmação de e-mail no cadastro, recuperação de senha e login OAuth
 * (Google). Todos usam o mesmo mecanismo do Supabase (troca de `code` por
 * sessão via PKCE), então não há necessidade de rotas separadas por fluxo.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const requestedNext = getSafeRedirectPath(searchParams.get("next"), "/minha-conta");

  // O usuário cancelou no provedor (ex: fechou a tela de consentimento do
  // Google) ou o provedor retornou um erro — nunca há `code` nesse caso.
  if (oauthError) {
    return NextResponse.redirect(`${origin}/login?error=oauth_${oauthError}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profile } = user
        ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
        : { data: null };

      const next = isRedirectAllowedForRole(requestedNext, profile?.role)
        ? requestedNext
        : roleHomePath(profile?.role);
      return NextResponse.redirect(`${origin}${next}`);
    }

    const reason = error.message.toLowerCase().includes("already registered") ? "conflict" : "exchange";
    return NextResponse.redirect(`${origin}/login?error=oauth_${reason}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
