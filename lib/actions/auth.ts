"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { onlyDigits } from "@/lib/format";
import { getSafeRedirectPath } from "@/lib/redirect";
import {
  identifierIsEmail,
  loginSchema,
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type SignUpInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";

type ActionResult = { error: string } | { error?: undefined };

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function signUpAction(input: SignUpInput): Promise<ActionResult & { checkEmail?: boolean }> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const { name, whatsapp, email, password } = parsed.data;
  // Cadastro público sempre cria `customer` — role de restaurant_owner só é
  // atribuída via app_metadata pelo admin (createUser com service role).
  const destination = "/minha-conta";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, whatsapp: onlyDigits(whatsapp) },
      emailRedirectTo: `${appUrl()}/auth/callback?next=${destination}`,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered") || error.code === "user_already_exists") {
      return { error: "Este e-mail já está cadastrado. Faça login." };
    }
    return { error: "Não foi possível criar sua conta. Tente novamente." };
  }

  if (data.session) {
    redirect(destination);
  }

  return { checkEmail: true };
}

export async function loginAction(
  input: LoginInput,
  redirectTo?: string,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const { identifier, password } = parsed.data;

  let email = identifier.trim();

  if (!identifierIsEmail(identifier)) {
    const whatsapp = onlyDigits(identifier);
    const service = createServiceRoleClient();
    const { data: profile } = await service
      .from("profiles")
      .select("email")
      .eq("whatsapp", whatsapp)
      .maybeSingle();

    if (!profile?.email) {
      return { error: "Não encontramos uma conta com este e-mail ou WhatsApp." };
    }
    email = profile.email;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "E-mail/WhatsApp ou senha incorretos." };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();

  const safeRedirect = redirectTo ? getSafeRedirectPath(redirectTo, "") : "";
  if (safeRedirect) redirect(safeRedirect);
  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role === "restaurant_owner") redirect("/painel");
  redirect("/minha-conta");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordResetAction(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl()}/auth/callback?next=/recuperar-senha/redefinir`,
  });

  // Nunca revela se o e-mail existe ou não (evita enumeração de contas).
  return {};
}

export async function updatePasswordAction(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Não foi possível redefinir sua senha. Solicite um novo link." };

  return {};
}
