import { Plus } from "lucide-react";
import { formatCurrencyBRL } from "@/lib/format";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import type { StorefrontProduct } from "@/lib/data/storefront";

export function ProductCard({ product, onSelect }: { product: StorefrontProduct; onSelect: () => void }) {
  const hasPromo = product.promo_price != null && product.promo_price < product.price;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-2xl border border-[var(--store-border)] bg-[var(--store-card)] p-3 text-left transition-colors hover:border-[var(--store-primary)]/40 sm:gap-4 sm:p-4"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-[var(--store-text)]">{product.name}</p>
        {product.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-[var(--store-text-muted)]">{product.description}</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          {hasPromo && (
            <span className="text-xs text-[var(--store-text-muted)] line-through">
              {formatCurrencyBRL(product.price)}
            </span>
          )}
          <span className="font-semibold text-[var(--store-price)]">
            {formatCurrencyBRL(hasPromo ? product.promo_price! : product.price)}
          </span>
        </div>
      </div>

      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-[var(--store-category-bg)] sm:size-24">
        <ImageWithFallback src={product.image_url} alt={product.name} fill sizes="96px" className="object-cover" showLabel={false} />
        <span className="absolute -bottom-2 -right-2 grid size-7 place-items-center rounded-full bg-[var(--store-button)] text-[var(--store-button-text)] shadow">
          <Plus className="size-4" />
        </span>
      </div>
    </button>
  );
}
