import { ShoppingBag } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { storeThemeToCssVars, type StoreTheme } from "@/lib/theme/store-theme";

/**
 * Preview compacto da loja pública — atualiza em tempo real com watch() do
 * formulário de aparência (tema, nome) e com o estado local de
 * banner/logo já enviados (antes de "Salvar"). Mesma proporção 16:5 do
 * banner oficial e mesmo overlap de logo do StoreHeader real, só em escala
 * menor — não é uma cópia da loja inteira, só o essencial: banner, logo,
 * nome, categorias, card de produto, preço, botão e cores.
 */
export function StoreThemePreview({
  theme,
  storeName,
  bannerUrl,
  logoUrl,
}: {
  theme: StoreTheme;
  storeName: string;
  bannerUrl?: string | null;
  logoUrl?: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border" style={storeThemeToCssVars(theme)}>
      <div className="relative aspect-[16/5] w-full" style={{ background: "var(--store-header)" }}>
        {bannerUrl && (
          <ImageWithFallback src={bannerUrl} alt="" fill sizes="320px" className="object-cover object-center" showLabel={false} />
        )}
      </div>

      <div className="space-y-3 p-4" style={{ background: "var(--store-bg)" }}>
        <div className="-mt-9 flex items-end">
          <div
            className="relative size-9 shrink-0 overflow-hidden rounded-xl border-2 shadow-sm"
            style={{ borderColor: "var(--store-header)" }}
          >
            {logoUrl ? (
              <ImageWithFallback src={logoUrl} alt="" fill sizes="36px" className="object-cover" showLabel={false} />
            ) : (
              <div
                className="grid size-full place-items-center text-xs font-bold"
                style={{ background: "var(--store-primary)", color: "var(--store-button-text)" }}
              >
                {(storeName || "S").charAt(0)}
              </div>
            )}
          </div>
        </div>

        <p className="truncate text-sm font-semibold" style={{ color: "var(--store-text)" }}>
          {storeName || "Sua loja"}
        </p>

        <div className="flex gap-2">
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: "var(--store-category-active)", color: "var(--store-button-text)" }}
          >
            Combos
          </span>
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: "var(--store-category-bg)", color: "var(--store-text)" }}
          >
            Bebidas
          </span>
        </div>

        <div
          className="flex items-center gap-3 rounded-xl p-3"
          style={{ background: "var(--store-card)", border: "1px solid var(--store-border)" }}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium" style={{ color: "var(--store-text)" }}>
              Produto de exemplo
            </p>
            <p className="mt-1 text-sm font-semibold" style={{ color: "var(--store-price)" }}>
              R$ 29,90
            </p>
          </div>
          <div className="size-14 shrink-0 rounded-lg" style={{ background: "var(--store-category-bg)" }} />
        </div>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
          style={{ background: "var(--store-button)", color: "var(--store-button-text)" }}
        >
          <ShoppingBag className="size-4" />
          Adicionar
        </button>
      </div>
    </div>
  );
}
