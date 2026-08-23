"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function CategoryNav({ categories }: { categories: { id: string; name: string }[] }) {
  const [activeId, setActiveId] = useState(categories[0]?.id);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(`categoria-${c.id}`))
      .filter((el): el is HTMLElement => !!el);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id.replace("categoria-", ""));
        }
      },
      // Não existe nenhum header fixo acima do nav em /loja/[slug] — o offset
      // aqui é só a altura do próprio nav (~64px, sticky em top-0), nunca a
      // altura de um header que não existe.
      { rootMargin: "-72px 0px -60% 0px", threshold: 0 },
    );

    for (const s of sections) observer.observe(s);
    return () => observer.disconnect();
  }, [categories]);

  if (categories.length === 0) return null;

  return (
    <div
      ref={navRef}
      className="sticky top-0 z-30 border-b border-[var(--store-border)] bg-[var(--store-header)]/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-4xl gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => (
          <a
            key={c.id}
            href={`#categoria-${c.id}`}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              activeId === c.id
                ? "border-[var(--store-category-active)] bg-[var(--store-category-active)] text-[var(--store-button-text)]"
                : "border-[var(--store-border)] bg-[var(--store-category-bg)] text-[var(--store-text)] hover:border-[var(--store-category-active)]/40",
            )}
          >
            {c.name}
          </a>
        ))}
      </div>
    </div>
  );
}
