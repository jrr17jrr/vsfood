"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function CategoryNav({ categories }: { categories: { id: string; name: string }[] }) {
  const [activeId, setActiveId] = useState(categories[0]?.id);

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(`categoria-${c.id}`))
      .filter((el): el is HTMLElement => !!el);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id.replace("categoria-", ""));
        }
      },
      // -64px = altura real do nav sticky (mesmo valor do scroll-mt-16 em
      // product-catalog.tsx) — só considera a seção "ativa" quando ela já
      // está visível abaixo da barra presa no topo.
      { rootMargin: "-64px 0px -65% 0px", threshold: 0 },
    );

    for (const s of sections) observer.observe(s);
    return () => observer.disconnect();
  }, [categories]);

  if (categories.length === 0) return null;

  function scrollToCategory(id: string) {
    const element = document.getElementById(`categoria-${id}`);
    if (!element) return;
    setActiveId(id);
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="sticky top-0 z-40 border-b border-[var(--store-border)] bg-[var(--store-category-bg)]">
      <div className="mx-auto flex max-w-4xl gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => (
          <button
            type="button"
            key={c.id}
            onClick={() => scrollToCategory(c.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              activeId === c.id
                ? "border-[var(--store-category-active)] bg-[var(--store-category-active)] text-[var(--store-button-text)]"
                : "border-[var(--store-border)] bg-[var(--store-category-bg)] text-[var(--store-text)] hover:border-[var(--store-category-active)]/40",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
