"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function CategoryNav({ categories }: { categories: { id: string; name: string }[] }) {
  const [activeId, setActiveId] = useState(categories[0]?.id);

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(`categoria-${c.id}`))
      .filter((el): el is HTMLElement => !!el);
    const lastCategoryId = categories[categories.length - 1]?.id;

    // Quando a página chega perto do fim, a última seção pode não ter espaço
    // suficiente abaixo dela para satisfazer a margem de -65% do observer
    // (ver rootMargin abaixo), então ele nunca a marca como ativa. Esse check
    // força a última categoria como ativa nesse caso.
    function isAtBottom() {
      return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (lastCategoryId && isAtBottom()) {
          setActiveId(lastCategoryId);
          return;
        }
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

    function handleScroll() {
      if (lastCategoryId && isAtBottom()) {
        setActiveId(lastCategoryId);
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
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
      <div className="mx-auto flex max-w-4xl gap-2 overflow-x-auto overflow-y-visible px-4 py-3 [scrollbar-width:none] [overscroll-behavior-x:contain] [&::-webkit-scrollbar]:hidden">
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
