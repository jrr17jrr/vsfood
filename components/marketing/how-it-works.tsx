import { Store, Settings, ClipboardList } from "lucide-react";

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
    <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Como funciona</h2>
        <p className="mt-3 text-muted-foreground">
          Você não precisa mexer em código nem depender de ninguém para manter sua loja no ar.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {steps.map((step, i) => (
          <div key={step.title} className="relative rounded-2xl border bg-card p-5">
            <span className="absolute -top-3 -left-3 grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {i + 1}
            </span>
            <step.icon className="size-6 text-primary" />
            <p className="mt-3 font-semibold">{step.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <code className="rounded-full border bg-secondary px-4 py-2 text-sm text-secondary-foreground">
          vsfood.com.br/loja/<span className="font-semibold text-primary">seu-restaurante</span>
        </code>
      </div>
    </section>
  );
}
