import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrencyBRL } from "@/lib/format";
import { getActivePlansWithFeatures } from "@/lib/data/marketing";

export async function Pricing() {
  const plans = await getActivePlansWithFeatures();

  if (plans.length === 0) return null;

  return (
    <section id="planos" className="mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Planos simples, sem pegadinha</h2>
        <p className="mt-3 text-muted-foreground">Comece grátis. Sem comissão por pedido, nunca.</p>
      </div>

      <div className={cn("mt-12 grid gap-6", plans.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3")}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col rounded-3xl border p-8",
              plan.is_featured ? "border-2 border-primary bg-card shadow-lg" : "bg-card/60",
            )}
          >
            {plan.is_featured && <Badge className="absolute -top-3 left-8">7 dias grátis</Badge>}
            {!plan.is_featured && plan.price_monthly === null && (
              <Badge variant="secondary" className="absolute -top-3 left-8">
                Em breve
              </Badge>
            )}
            <p className="text-lg font-semibold">{plan.name}</p>
            <p className="mt-2">
              {plan.price_monthly !== null ? (
                <>
                  <span className="text-4xl font-bold">{formatCurrencyBRL(plan.price_monthly)}</span>
                  <span className="text-muted-foreground">/mês</span>
                </>
              ) : (
                <span className="text-4xl font-bold text-muted-foreground">Em breve</span>
              )}
            </p>
            {plan.complement_text && <p className="mt-1 text-sm text-muted-foreground">{plan.complement_text}</p>}

            <ul className={cn("mt-6 flex-1 space-y-2.5", !plan.is_featured && "text-muted-foreground")}>
              {plan.features.map((f) => (
                <li key={f.id} className="flex items-start gap-2 text-sm">
                  <Check className={cn("mt-0.5 size-4 shrink-0", plan.is_featured && "text-primary")} />
                  {f.name}
                </li>
              ))}
            </ul>

            {plan.price_monthly !== null ? (
              <Button size="lg" className="mt-8" asChild variant={plan.is_featured ? "default" : "outline"}>
                <Link href="/cadastro?tipo=restaurante">{plan.cta_label}</Link>
              </Button>
            ) : (
              <Button size="lg" variant="outline" className="mt-8" disabled>
                {plan.cta_label}
              </Button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
