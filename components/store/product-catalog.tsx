"use client";

import { useState } from "react";
import { ProductCard } from "./product-card";
import { ProductModal } from "./product-modal";
import type { StorefrontCategory, StorefrontProduct } from "@/lib/data/storefront";

export function ProductCatalog({ categories }: { categories: StorefrontCategory[] }) {
  const [selected, setSelected] = useState<StorefrontProduct | null>(null);
  const [open, setOpen] = useState(false);

  function handleSelect(product: StorefrontProduct) {
    setSelected(product);
    setOpen(true);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-6">
      {categories.map((category) => (
        <section key={category.id} id={`categoria-${category.id}`} className="scroll-mt-32">
          <h2 className="mb-3 text-lg font-bold">{category.name}</h2>
          <div className="grid gap-3">
            {category.products.map((product) => (
              <ProductCard key={product.id} product={product} onSelect={() => handleSelect(product)} />
            ))}
          </div>
        </section>
      ))}

      <ProductModal product={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
