import Image from "next/image";
import { Plus } from "lucide-react";
import { formatCurrencyBRL } from "@/lib/format";
import type { StorefrontProduct } from "@/lib/data/storefront";

export function ProductCard({ product, onSelect }: { product: StorefrontProduct; onSelect: () => void }) {
  const hasPromo = product.promo_price != null && product.promo_price < product.price;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left transition-colors hover:border-primary/40 sm:gap-4 sm:p-4"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium">{product.name}</p>
        {product.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          {hasPromo && (
            <span className="text-xs text-muted-foreground line-through">{formatCurrencyBRL(product.price)}</span>
          )}
          <span className="font-semibold text-primary">
            {formatCurrencyBRL(hasPromo ? product.promo_price! : product.price)}
          </span>
        </div>
      </div>

      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-24">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill sizes="96px" className="object-cover" />
        ) : (
          <div className="size-full bg-gradient-to-br from-secondary to-muted" />
        )}
        <span className="absolute -bottom-2 -right-2 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground shadow">
          <Plus className="size-4" />
        </span>
      </div>
    </button>
  );
}
