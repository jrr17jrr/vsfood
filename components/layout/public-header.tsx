import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VsfoodLogo } from "./vsfood-logo";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="VSFood">
          <VsfoodLogo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/#como-funciona" className="hover:text-foreground">
            Como funciona
          </Link>
          <Link href="/#recursos" className="hover:text-foreground">
            Recursos
          </Link>
          <Link href="/#planos" className="hover:text-foreground">
            Planos
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild>
            <Link href="/cadastro?tipo=restaurante">Começar grátis</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
