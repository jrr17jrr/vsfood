import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getSafeRedirectPath } from "@/lib/redirect";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const { redirect, error } = await searchParams;
  const safeRedirect = redirect ? getSafeRedirectPath(redirect, "") || undefined : undefined;

  return (
    <AuthShell title="Entrar" description="Acesse sua conta VSFood.">
      <LoginForm redirectTo={safeRedirect} errorCode={error} />
    </AuthShell>
  );
}
