import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { getTrialSettings } from "@/lib/data/trial-settings";
import { formatTrialHeadline } from "@/lib/trial";
import { getDemoRestaurant, getDemoPreviewProducts } from "@/lib/data/marketing";
import { formatCurrencyBRL } from "@/lib/format";

const staticBenefits = [
  "Sem comissão do VSFood por pedido",
  "Cancele quando quiser",
  "Pagamento online",
  "Cardápio digital",
  "Suporte humanizado",
];

const floatingCards = [
  { title: "Pedidos", subtitle: "Em tempo real" },
  { title: "Pagamento", subtitle: "100% seguro" },
] as const;

export async function Hero() {
  const [trial, demo] = await Promise.all([getTrialSettings(), getDemoRestaurant()]);
  const products = demo ? await getDemoPreviewProducts(demo.id) : [];

  const benefits = trial.is_active
    ? [formatTrialHeadline(trial.headline_template, trial.default_days), ...staticBenefits]
    : staticBenefits;

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-glow absolute top-[-220px] left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-primary/25 blur-[130px] dark:bg-primary/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent dark:from-primary/15" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 md:grid-cols-2 md:pt-24 md:pb-28">
        <div>
          <Reveal>
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Feito para restaurantes, lanchonetes e delivery
            </span>
          </Reveal>

          <Reveal delayMs={90}>
            <h1 className="mt-5 text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Seu restaurante online,{" "}
              <span className="bg-gradient-to-r from-brand-orange to-brand-red bg-clip-text text-transparent">
                do seu jeito.
              </span>
            </h1>
          </Reveal>

          <Reveal delayMs={170}>
            <p className="mt-5 max-w-md text-lg text-muted-foreground text-pretty">
              Receba pedidos, gerencie seu cardápio e tenha sua própria loja online em um só lugar.
            </p>
          </Reveal>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2.5">
            {benefits.map((b, i) => (
              <Reveal key={b} delayMs={230 + i * 50}>
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                  {b}
                </span>
              </Reveal>
            ))}
          </div>

          <Reveal delayMs={230 + benefits.length * 50 + 60}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="group h-12 px-6 text-base shadow-[0_0_0_1px_rgba(240,99,29,0.35),0_0_30px_-8px_var(--primary)] transition-shadow hover:shadow-[0_0_0_1px_rgba(240,99,29,0.5),0_0_44px_-6px_var(--primary)]"
                asChild
              >
                <Link href="/cadastro?tipo=restaurante">
                  Quero minha loja grátis
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
              {demo && (
                <Button size="lg" variant="outline" className="h-12 px-6 text-base" asChild>
                  <Link href={`/loja/${demo.slug}`}>Ver demonstração</Link>
                </Button>
              )}
            </div>
          </Reveal>
        </div>

        <Reveal direction="right" delayMs={120} className="relative mx-auto w-full max-w-sm md:max-w-none">
          <div className="relative mx-auto w-full max-w-sm">
            <div
              className="animate-glow absolute -inset-6 -z-10 rounded-[2.75rem] bg-gradient-to-br from-brand-orange/35 to-brand-red/20 blur-2xl"
              aria-hidden
            />

            <div className="animate-float overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 p-3 shadow-2xl shadow-black/10 backdrop-blur dark:shadow-black/40">
              <div className="overflow-hidden rounded-[1.5rem] border border-border/60">
                <div className="relative h-28 w-full bg-gradient-to-br from-brand-orange to-brand-red">
                  {demo?.banner_url && (
                    <Image
                      src={demo.banner_url}
                      alt=""
                      fill
                      sizes="384px"
                      className="object-cover opacity-90"
                    />
                  )}
                </div>
                <div className="space-y-3 bg-background p-4">
                  <div className="-mt-9 flex items-end gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border-2 border-background bg-white p-1 shadow">
                      {demo?.logo_url ? (
                        <Image src={demo.logo_url} alt={demo.name} fill sizes="56px" className="object-contain" />
                      ) : (
                        <div className="grid size-full place-items-center bg-primary text-lg font-bold text-primary-foreground">
                          {(demo?.name ?? "VS").charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">{demo?.name ?? "Sua loja"}</p>
                    <p className="text-xs text-primary">
                      {demo ? "Loja de demonstração • Aberto agora" : "Cardápio digital sempre online"}
                    </p>
                  </div>
                  {demo?.cuisine_type && (
                    <div className="flex gap-2 text-xs">
                      <span className="rounded-full bg-secondary px-2 py-1">{demo.cuisine_type}</span>
                    </div>
                  )}
                  {products.length > 0 ? (
                    products.map((p) => (
                      <div key={p.name} className="flex items-center gap-3 rounded-xl border border-border/60 p-2">
                        <div className="size-12 shrink-0 rounded-lg bg-muted" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrencyBRL(p.price)}</p>
                        </div>
                        <div className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          +
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                      Cardápio digital, sempre online
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="animate-float-delayed absolute -right-6 -bottom-6 hidden w-40 rounded-2xl border border-border/60 bg-card p-3 shadow-xl sm:block">
              <p className="text-xs font-medium text-muted-foreground">{floatingCards[1].title}</p>
              <p className="text-sm font-semibold">{floatingCards[1].subtitle}</p>
            </div>
            <div className="animate-float absolute -top-6 -left-6 hidden w-36 rounded-2xl border border-border/60 bg-card p-3 shadow-xl sm:block">
              <p className="text-xs font-medium text-muted-foreground">{floatingCards[0].title}</p>
              <p className="text-sm font-semibold">{floatingCards[0].subtitle}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
