import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/marketing/reveal";
import { formatCurrencyBRL } from "@/lib/format";
import { getActivePlansWithFeatures } from "@/lib/data/marketing";
import { getTrialSettings } from "@/lib/data/trial-settings";
import { formatTrialHeadline } from "@/lib/trial";

export async function Pricing() {
  const [plans, trial] = await Promise.all([getActivePlansWithFeatures(), getTrialSettings()]);

  if (plans.length === 0) return null;

  const trialHeadline = trial.is_active ? formatTrialHeadline(trial.headline_template, trial.default_days) : null;

  return (
    <section id="planos" className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Planos simples, sem pegadinha</h2>
        <p className="mt-3 text-muted-foreground">
          {trial.is_active ? "Comece grátis. " : ""}Sem comissão por pedido, nunca.
        </p>
      </Reveal>

      <div className={cn("mt-12 grid gap-6", plans.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3")}>
        {plans.map((plan, i) => (
          <Reveal key={plan.id} delayMs={i * 100}>
            <div
              className={cn(
                "relative flex h-full flex-col rounded-3xl border p-8 transition-all duration-300",
                plan.is_featured
                  ? "border-primary/50 bg-card shadow-[0_0_0_1px_rgba(240,99,29,0.15),0_20px_50px_-20px_rgba(240,99,29,0.35)]"
                  : "border-border/70 bg-card/60 hover:border-border",
              )}
            >
              {plan.is_featured && (
                <div
                  className="animate-glow pointer-events-none absolute -inset-px -z-10 rounded-3xl bg-gradient-to-b from-primary/10 to-transparent"
                  aria-hidden
                />
              )}
              {plan.is_featured && (
                <Badge className="absolute -top-3 left-8 shadow-sm">{trialHeadline ?? "Recomendado"}</Badge>
              )}
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
                <Button
                  size="lg"
                  className={cn("mt-8 h-11", plan.is_featured && "shadow-[0_0_24px_-6px_var(--primary)]")}
                  asChild
                  variant={plan.is_featured ? "default" : "outline"}
                >
                  <Link href="/cadastro?tipo=restaurante">{plan.cta_label}</Link>
                </Button>
              ) : (
                <Button size="lg" variant="outline" className="mt-8 h-11" disabled>
                  {plan.cta_label}
                </Button>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
