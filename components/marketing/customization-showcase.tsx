import { Reveal } from "@/components/marketing/reveal";
import { StoreThemePreview } from "@/components/painel/store-theme-preview";
import { THEME_PRESETS } from "@/lib/theme/store-theme";

/**
 * Usa os mesmos THEME_PRESETS reais do painel de aparência (/painel/aparencia)
 * — os exemplos abaixo são variações de cor de verdade que qualquer loja pode
 * aplicar, não restaurantes fictícios usados como prova social.
 */
export function CustomizationShowcase() {
  return (
    <section className="relative border-y border-border/60 bg-secondary/20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">A cara do seu restaurante</h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Personalize cores, logo, banner e cardápio da sua loja pública direto pelo painel de aparência.
              Sua marca, não um template genérico.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {THEME_PRESETS.map((preset) => (
                <span
                  key={preset.key}
                  className="rounded-full border border-border/70 bg-secondary/50 px-3 py-1 text-xs font-medium text-secondary-foreground"
                >
                  {preset.label}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal direction="right" delayMs={100}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-2">
              {THEME_PRESETS.map((preset, i) => (
                <div
                  key={preset.key}
                  className="group overflow-hidden rounded-2xl border border-border/70 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{ transitionDelay: `${i * 40}ms` }}
                >
                  <StoreThemePreview theme={preset.theme} storeName="Sua loja" />
                  <p className="border-t border-border/70 bg-card px-3 py-2 text-center text-xs font-medium text-muted-foreground">
                    Exemplo: {preset.label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
