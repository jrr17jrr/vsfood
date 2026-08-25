import { Store, Settings, ClipboardList, LayoutDashboard } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const steps = [
  {
    icon: Store,
    title: "Criamos sua loja",
    description: "O time VSFood cadastra seu restaurante e libera seu acesso.",
  },
  {
    icon: Settings,
    title: "Você configura tudo pelo painel",
    description: "Cardápio, fotos, adicionais, entrega, horários, aparência e pagamentos.",
  },
  {
    icon: ClipboardList,
    title: "Seus clientes fazem pedidos online",
    description: "Compartilhe o link da loja e comece a receber pedidos.",
  },
  {
    icon: LayoutDashboard,
    title: "Você acompanha e gerencia",
    description: "Acompanhe pedidos e organize sua operação pelo painel.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent" />
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Como funciona</h2>
          <p className="mt-3 text-muted-foreground">
            Em poucos passos sua loja já está pronta para receber pedidos.
          </p>
        </Reveal>

        <Reveal delayMs={80} className="relative mt-14">
          <div
            data-line
            className="absolute top-8 right-[12.5%] left-[12.5%] hidden h-[3px] rounded-full bg-gradient-to-r from-primary/70 via-primary/40 to-primary/70 lg:block"
            aria-hidden
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <Reveal key={step.title} delayMs={i * 120}>
                <div className="group relative flex h-full flex-col items-center rounded-2xl border border-border/70 bg-card/70 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_10px_30px_-14px_rgba(240,99,29,0.4)] sm:items-start sm:text-left">
                  <div className="relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-background text-primary shadow-[0_0_0_1px_rgba(240,99,29,0.08)]">
                    <step.icon className="size-6" />
                    <span className="absolute -top-2.5 -right-2.5 grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                      {i + 1}
                    </span>
                  </div>
                  <p className="mt-5 font-semibold">{step.title}</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        <Reveal delayMs={480} className="mt-12 flex justify-center">
          <code className="rounded-full border border-border/70 bg-secondary/60 px-4 py-2 text-sm text-secondary-foreground">
            vsfood.com.br/loja/<span className="font-semibold text-primary">seu-restaurante</span>
          </code>
        </Reveal>
      </div>
    </section>
  );
}
