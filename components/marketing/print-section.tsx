import Link from "next/link";
import { ArrowRight, Printer, CheckCircle2, RotateCcw, Cpu, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

const highlights = [
  { icon: Printer, label: "Impressão automática" },
  { icon: CheckCircle2, label: "Aceite automático" },
  { icon: RotateCcw, label: "Reimpressão" },
  { icon: Cpu, label: "Funciona em segundo plano" },
  { icon: Settings2, label: "Configuração simples" },
];

export function PrintSection() {
  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-secondary/20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Pedidos direto para a cozinha</h2>
            <p className="mt-3 text-muted-foreground">
              Com o VSFood Print, novos pedidos podem ser impressos automaticamente no computador da sua loja, sem
              precisar abrir cada pedido manualmente.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3">
              {highlights.map((h) => (
                <span key={h.label} className="flex items-center gap-2 text-sm font-medium">
                  <h.icon className="size-4 shrink-0 text-primary" />
                  {h.label}
                </span>
              ))}
            </div>

            <Button size="lg" className="group mt-8 h-12 w-full px-6 text-base sm:w-auto" asChild>
              <Link href="/vsfood-print">
                Conhecer o VSFood Print
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </Reveal>

          <Reveal direction="right" delayMs={100}>
            <div className="relative rounded-3xl border border-border/70 bg-card p-6 shadow-xl shadow-black/10 dark:shadow-black/40">
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Printer className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">VSFood Print</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-emerald-500" /> Conectado
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2 font-mono text-xs text-muted-foreground">
                <p>19:42 — pedido #154 recebido</p>
                <p>19:42 — enviando para HP LaserJet</p>
                <p className="text-emerald-600 dark:text-emerald-400">19:42 — impressão confirmada ✓</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
