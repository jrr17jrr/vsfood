import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const basicFeatures = [
  "Cardápio digital",
  "Produtos e categorias ilimitados",
  "Adicionais e complementos",
  "Carrinho e pedidos ilimitados",
  "Pagamento online (PIX e cartão)",
  "PIX manual, dinheiro e cartão na entrega",
  "Entrega e retirada",
  "Taxas de entrega por bairro",
  "Cupons de desconto",
  "QR Code da loja",
  "Painel completo de pedidos",
  "Relatórios básicos",
  "Personalização da loja",
  "Sem comissão do VSFood por pedido",
];

const proFeatures = [
  "Relatórios avançados",
  "Programa de fidelidade",
  "Recuperação de carrinho",
  "Upsell automático",
  "Agendamento de pedidos",
  "Controle de estoque",
  "Impressão automática",
  "Modo cozinha",
  "Múltiplos usuários",
  "Automações",
];

export function Pricing() {
  return (
    <section id="planos" className="mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Planos simples, sem pegadinha</h2>
        <p className="mt-3 text-muted-foreground">Comece grátis. Sem comissão por pedido, nunca.</p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="relative flex flex-col rounded-3xl border-2 border-primary bg-card p-8 shadow-lg">
          <Badge className="absolute -top-3 left-8">7 dias grátis</Badge>
          <p className="text-lg font-semibold">Plano Básico</p>
          <p className="mt-2">
            <span className="text-4xl font-bold">R$69,90</span>
            <span className="text-muted-foreground">/mês</span>
          </p>
          <ul className="mt-6 flex-1 space-y-2.5">
            {basicFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/cadastro?tipo=restaurante">Testar 7 dias grátis</Link>
          </Button>
        </div>

        <div className={cn("relative flex flex-col rounded-3xl border bg-card/60 p-8")}>
          <Badge variant="secondary" className="absolute -top-3 left-8">
            Em breve
          </Badge>
          <p className="text-lg font-semibold">VSFood Pro</p>
          <p className="mt-2 text-4xl font-bold text-muted-foreground">Em breve</p>
          <ul className="mt-6 flex-1 space-y-2.5 text-muted-foreground">
            {proFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Button size="lg" variant="outline" className="mt-8" disabled>
            Em breve
          </Button>
        </div>
      </div>
    </section>
  );
}
