"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const STICKY_NAV_HEIGHT = 64;

export function CategoryNav({ categories }: { categories: { id: string; name: string }[] }) {
  const [activeId, setActiveId] = useState(categories[0]?.id);
  const navRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(`categoria-${c.id}`))
      .filter((el): el is HTMLElement => !!el);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) {
          setActiveId(visible[0].target.id.replace("categoria-", ""));
        }
      },
      {
        // O menu fica em top:0 e mede ~64px. O offset considera apenas o
        // próprio menu; a loja pública não tem outro header fixo acima dele.
        rootMargin: `-${STICKY_NAV_HEIGHT + 8}px 0px -60% 0px`,
        threshold: 0,
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [categories]);

  useEffect(() => {
    if (!activeId) return;
    buttonRefs.current[activeId]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeId]);

  if (categories.length === 0) return null;

  function scrollToCategory(id: string) {
    const element = document.getElementById(`categoria-${id}`);
    if (!element) return;

    setActiveId(id);

    const navHeight = navRef.current?.offsetHeight ?? STICKY_NAV_HEIGHT;
    const top = element.getBoundingClientRect().top + window.scrollY - navHeight - 12;

    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  return (
    <div
      ref={navRef}
      className="sticky top-0 z-50 w-full border-b border-[var(--store-border)] bg-[var(--store-header)] shadow-sm"
    >
      <div className="mx-auto flex max-w-4xl gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => (
          <button
            ref={(node) => {
              buttonRefs.current[category.id] = node;
            }}
            type="button"
            key={category.id}
            onClick={() => scrollToCategory(category.id)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              activeId === category.id
                ? "border-[var(--store-category-active)] bg-[var(--store-category-active)] text-[var(--store-button-text)]"
                : "border-[var(--store-border)] bg-[var(--store-category-bg)] text-[var(--store-text)] hover:border-[var(--store-category-active)]/50",
            )}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
