import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const badges = [
  "7 dias grátis",
  "Sem comissão do VSFood por pedido",
  "Pagamento online",
  "Cancele quando quiser",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-amber/25 via-transparent to-transparent" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="inline-flex items-center rounded-full border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            Feito para restaurantes, lanchonetes e delivery
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Seu restaurante pronto para receber pedidos online.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground text-pretty">
            Crie seu cardápio, receba pedidos e gerencie tudo em um só lugar.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {badges.map((b) => (
              <li key={b} className="flex items-center gap-1.5 text-sm font-medium">
                <CheckCircle2 className="size-4 text-primary" />
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/cadastro?tipo=restaurante">Começar grátis</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/loja/dudu-burger">Ver demonstração</Link>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="rounded-3xl border bg-card p-3 shadow-xl">
            <div className="overflow-hidden rounded-2xl border">
              <div className="h-24 bg-gradient-to-br from-brand-orange to-brand-red" />
              <div className="space-y-3 bg-background p-4">
                <div className="-mt-10 size-14 rounded-2xl border-4 border-background bg-brand-amber shadow" />
                <div>
                  <p className="font-semibold">Dudu Burger</p>
                  <p className="text-xs text-primary">Aberto agora • 35-45 min</p>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="rounded-full bg-secondary px-2 py-1">Hambúrgueres</span>
                  <span className="rounded-full bg-secondary px-2 py-1">Combos</span>
                  <span className="rounded-full bg-secondary px-2 py-1">Bebidas</span>
                </div>
                {["X-Bacon", "X-Tudo"].map((name) => (
                  <div key={name} className="flex items-center gap-3 rounded-xl border p-2">
                    <div className="size-12 shrink-0 rounded-lg bg-muted" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">R$ 28,90</p>
                    </div>
                    <div className="grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      +
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 hidden w-48 rounded-2xl border bg-card p-3 shadow-lg sm:block">
            <p className="text-xs font-medium text-muted-foreground">Pedidos hoje</p>
            <p className="text-2xl font-bold text-primary">R$ 1.284</p>
            <p className="text-xs text-muted-foreground">42 pedidos</p>
          </div>
        </div>
      </div>
    </section>
  );
}
