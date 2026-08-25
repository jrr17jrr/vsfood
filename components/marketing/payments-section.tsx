import { Banknote, CreditCard, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const methods = [
  { icon: Banknote, title: "PIX", description: "Pagamento instantâneo, confirmado automaticamente." },
  { icon: CreditCard, title: "Cartão", description: "Crédito processado online, direto no checkout da sua loja." },
  { icon: ShieldCheck, title: "Seguro", description: "Pagamentos processados pelo Mercado Pago." },
];

export function PaymentsSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Venda online sem complicação</h2>
        <p className="mt-3 text-muted-foreground">
          Seu cliente paga PIX ou cartão direto no pedido — sem trocar link, sem enviar comprovante no WhatsApp.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {methods.map((m, i) => (
          <Reveal key={m.title} delayMs={i * 100}>
            <div className="flex h-full flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card/60 p-6 text-center transition-colors hover:border-primary/40">
              <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <m.icon className="size-6" />
              </div>
              <p className="font-semibold">{m.title}</p>
              <p className="text-sm text-muted-foreground">{m.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
