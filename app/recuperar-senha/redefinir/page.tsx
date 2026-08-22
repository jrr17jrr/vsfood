import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Redefinir senha" };

export default function RedefinirSenhaPage() {
  return (
    <AuthShell title="Defina sua nova senha" description="Escolha uma nova senha para sua conta.">
      <ResetPasswordForm />
    </AuthShell>
  );
}
