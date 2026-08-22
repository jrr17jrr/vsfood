import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecuperarSenhaPage() {
  return (
    <AuthShell title="Recuperar senha" description="Informe seu e-mail para receber o link de redefinição.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
