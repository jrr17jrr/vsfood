import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { getTrialSettings } from "@/lib/data/trial-settings";
import { formatTrialHeadline } from "@/lib/trial";

export async function FinalCTA() {
  const trial = await getTrialSettings();

  return (
    <section className="px-4 py-20 sm:py-28">
      <Reveal className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card px-6 py-14 text-center sm:px-14">
          <div
            className="animate-glow pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/25 via-transparent to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -top-24 -right-24 -z-10 size-72 rounded-full bg-gradient-to-br from-brand-orange/30 to-brand-red/10 blur-3xl"
            aria-hidden
          />

          <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>

          <h2 className="mt-6 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Pronto para levar seu restaurante para o próximo nível?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Fale com o VSFood e comece a receber pedidos no seu próprio site em poucos dias.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Button
              size="lg"
              className="group h-12 w-full max-w-xs px-6 text-base shadow-[0_0_0_1px_rgba(240,99,29,0.35),0_0_30px_-8px_var(--primary)] hover:shadow-[0_0_0_1px_rgba(240,99,29,0.5),0_0_44px_-6px_var(--primary)]"
              asChild
            >
              <Link href="/cadastro?tipo=restaurante">
                Criar minha loja grátis
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            {trial.is_active && (
              <p className="text-xs font-medium text-muted-foreground">
                {formatTrialHeadline(trial.headline_template, trial.default_days)}.
              </p>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
