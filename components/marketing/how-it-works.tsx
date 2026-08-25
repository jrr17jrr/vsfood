import { Store, Settings, ClipboardList } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const steps = [
  {
    icon: Store,
    title: "Criamos sua loja",
    description: "O time VSFood cadastra seu restaurante e libera o acesso do painel para você.",
  },
  {
    icon: Settings,
    title: "Você configura tudo pelo painel",
    description: "Cardápio, fotos, adicionais, entrega, horários e forma de pagamento — no seu ritmo.",
  },
  {
    icon: ClipboardList,
    title: "Seus clientes fazem pedidos online",
    description: "Compartilhe o link da sua loja e acompanhe cada pedido em tempo real.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Como funciona</h2>
        <p className="mt-3 text-muted-foreground">
          Você não precisa mexer em código nem depender de ninguém para manter sua loja no ar.
        </p>
      </Reveal>

      <Reveal className="relative mt-16">
        <div
          data-line
          className="absolute top-6 right-[16.6%] left-[16.6%] hidden h-px bg-gradient-to-r from-primary/60 via-primary/30 to-primary/60 sm:block"
          aria-hidden
        />
        <div className="grid gap-8 sm:grid-cols-3 sm:gap-6">
          {steps.map((step, i) => (
            <Reveal key={step.title} delayMs={i * 140} className="relative">
              <div className="relative flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="relative z-10 grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-card text-primary shadow-[0_0_0_1px_rgba(240,99,29,0.08)]">
                  <step.icon className="size-5" />
                  <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                </div>
                <p className="mt-4 font-semibold">{step.title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Reveal>

      <Reveal delayMs={420} className="mt-10 flex justify-center">
        <code className="rounded-full border border-border/70 bg-secondary/60 px-4 py-2 text-sm text-secondary-foreground">
          vsfood.com.br/loja/<span className="font-semibold text-primary">seu-restaurante</span>
        </code>
      </Reveal>
    </section>
  );
}
