"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

type ImageWithFallbackProps = Omit<ImageProps, "src" | "alt" | "onError"> & {
  src: string | null | undefined;
  alt: string;
  fallbackClassName?: string;
  showLabel?: boolean;
};

/**
 * Wrapper de next/image que nunca deixa o ícone quebrado do navegador
 * aparecer: sem `src` ou quando o carregamento falha (`onError`), renderiza
 * um fallback neutro e consistente em vez do `<img>` real.
 */
export function ImageWithFallback({
  src,
  alt,
  className,
  fallbackClassName,
  showLabel = true,
  ...props
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex size-full flex-col items-center justify-center gap-1 bg-muted text-muted-foreground",
          fallbackClassName ?? className,
        )}
      >
        <ImageOff className="size-5" />
        {showLabel && <span className="text-[10px] leading-none">Imagem indisponível</span>}
      </div>
    );
  }

  return <Image src={src} alt={alt} className={className} onError={() => setFailed(true)} {...props} />;
}
