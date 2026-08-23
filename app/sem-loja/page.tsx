import type { Metadata } from "next";
import Link from "next/link";
import { Store } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Nenhuma loja vinculada" };

/**
 * Fora de app/painel/ de propósito: requireRestaurantMembership() manda pra
 * cá exatamente quando não acha vínculo, e app/painel/layout.tsx chama
 * requireRestaurantMembership() de novo — se esta página estivesse dentro de
 * app/painel/, entraria num loop de redirect para si mesma.
 */
export default async function SemLojaPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "restaurant_owner") redirect("/");

  return (
    <AuthShell
      title="Nenhuma loja vinculada à sua conta."
      description="Entre em contato com o suporte VSFood para vincular ou criar sua loja."
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Store className="size-6" />
        </div>
        <p className="text-sm text-muted-foreground">
          O cadastro de restaurantes no VSFood é feito pelo time VSFood. Se você acredita que
          isso é um engano, fale com o suporte.
        </p>
        <div className="flex w-full flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/">Voltar para o início</Link>
          </Button>
          <form action={signOutAction} className="w-full">
            <Button type="submit" variant="outline" className="w-full">
              Sair
            </Button>
          </form>
        </div>
      </div>
    </AuthShell>
  );
}
