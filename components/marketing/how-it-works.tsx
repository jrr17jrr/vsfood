import { Store, BookOpenText, Wallet, Share2, ClipboardList } from "lucide-react";

const steps = [
  { icon: Store, title: "Crie sua loja", description: "Nome, logo, banner e endereço em poucos cliques." },
  { icon: BookOpenText, title: "Cadastre seu cardápio", description: "Categorias, produtos, fotos e adicionais." },
  { icon: Wallet, title: "Conecte seu Mercado Pago", description: "PIX e cartão direto na sua conta." },
  { icon: Share2, title: "Divulgue seu link", description: "vsfood.com.br/loja/seu-restaurante" },
  { icon: ClipboardList, title: "Receba pedidos", description: "Tudo organizado no seu painel." },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Comece em poucos minutos</h2>
        <p className="mt-3 text-muted-foreground">
          Sem burocracia. Do cadastro ao primeiro pedido em um único fluxo.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
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
