"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Fade/slide sutil quando o elemento entra na viewport. CSS puro
 * (app/globals.css) + IntersectionObserver — sem dependências novas.
 * Respeita prefers-reduced-motion via media query no CSS.
 */
export function Reveal({
  children,
  direction = "up",
  delayMs = 0,
  className,
}: {
  children: ReactNode;
  direction?: "up" | "left" | "right";
  delayMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal={direction}
      className={cn(visible && "is-visible", className)}
      style={{ transitionDelay: visible && delayMs ? `${delayMs}ms` : undefined }}
    >
      {children}
    </div>
  );
}
