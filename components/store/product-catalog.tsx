"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { ProductCard } from "./product-card";
import { ProductModal } from "./product-modal";
import type { StorefrontCategory, StorefrontProduct } from "@/lib/data/storefront";
import { cn } from "@/lib/utils";

export function ProductCatalog({
  categories,
  themeStyle,
}: {
  categories: StorefrontCategory[];
  themeStyle: CSSProperties;
}) {
  const [selected, setSelected] = useState<StorefrontProduct | null>(null);
  const [open, setOpen] = useState(false);

  function handleSelect(product: StorefrontProduct) {
    setSelected(product);
    setOpen(true);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-6">
      {categories.map((category, index) => (
        <section
          key={category.id}
          id={`categoria-${category.id}`}
          className={cn(
            "scroll-mt-16",
            // Dá espaço pra última categoria conseguir subir até a faixa "ativa"
            // do IntersectionObserver (rootMargin -64px topo / -65% fundo em
            // category-nav.tsx — só o top 35% da viewport, abaixo do nav sticky
            // de 4rem, conta como interseção). 50svh-4rem cobre isso na maioria
            // dos aparelhos sem chegar perto de uma tela inteira; isAtBottom()
            // no CategoryNav cobre o resto dos casos (categoria curta demais),
            // então não precisa ser exato. Só ocupa espaço se o conteúdo da
            // seção for mais baixo que isso.
            index === categories.length - 1 && "min-h-[calc(50svh-4rem)]",
          )}
        >
          <h2 className="mb-3 text-lg font-bold text-[var(--store-text)]">{category.name}</h2>
          <div className="grid gap-3">
            {category.products.map((product) => (
              <ProductCard key={product.id} product={product} onSelect={() => handleSelect(product)} />
            ))}
          </div>
        </section>
      ))}

      <ProductModal product={selected} open={open} onOpenChange={setOpen} themeStyle={themeStyle} />
    </div>
  );
}
