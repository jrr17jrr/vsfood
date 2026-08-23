import type { Metadata } from "next";
import Link from "next/link";
import { Store } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/signup-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Criar conta" };

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;

  if (tipo === "restaurante") {
    return (
      <AuthShell
        title="Cadastro de restaurantes é feito pelo time VSFood"
        description="Por enquanto, o acesso para donos de restaurante é liberado diretamente pelo VSFood — não é possível criar essa conta sozinho."
      >
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Store className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            Fale com o VSFood para colocar seu restaurante na plataforma. Se você já recebeu um
            acesso, basta entrar normalmente.
          </p>
          <div className="flex w-full flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/login">Já tenho acesso — Entrar</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Voltar para o início</Link>
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Criar conta" description="Crie sua conta para pedir nos restaurantes do VSFood.">
      <SignUpForm />
    </AuthShell>
  );
}
