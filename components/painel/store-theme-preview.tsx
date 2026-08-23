import { ShoppingBag } from "lucide-react";
import { storeThemeToCssVars, type StoreTheme } from "@/lib/theme/store-theme";

export function StoreThemePreview({ theme, storeName }: { theme: StoreTheme; storeName: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border" style={storeThemeToCssVars(theme)}>
      <div className="h-14" style={{ background: "var(--store-header)", borderBottom: "1px solid var(--store-border)" }} />
      <div className="space-y-3 p-4" style={{ background: "var(--store-bg)" }}>
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
              {storeName || "Sua loja"}
            </p>
            <p className="text-xs" style={{ color: "var(--store-text-muted)" }}>
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
