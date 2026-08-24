import type { SVGProps } from "react";
import Link from "next/link";
import type { Restaurant } from "@/types/database";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { VsfoodLogo } from "./vsfood-logo";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <VsfoodLogo className="text-base" />
        <p className="text-sm text-muted-foreground">
          © {year} VSFood • Desenvolvido por{" "}
          <a
            href="https://visionariodev.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4 hover:text-foreground"
          >
            Visionário Dev
          </a>
        </p>
      </div>
    </footer>
  );
}

function buildWhatsappUrl(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  // Números salvos no painel vêm sem DDI (ex: "11988887777"); com DDI o
  // valor já tem 12-13 dígitos e não deve ganhar um 55 duplicado.
  return `https://wa.me/${digits.length <= 11 ? `55${digits}` : digits}`;
}

function buildInstagramUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://instagram.com/${trimmed.replace(/^@/, "")}`;
}

function WhatsappIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.83L2 22l5.42-1.36a9.9 9.9 0 0 0 4.62 1.14h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2Zm5.8 14.06c-.24.68-1.4 1.32-1.93 1.4-.5.08-1.11.11-1.79-.11a16.5 16.5 0 0 1-1.6-.6c-2.82-1.22-4.66-4.07-4.8-4.26-.14-.19-1.15-1.53-1.15-2.92 0-1.39.73-2.07.99-2.35.26-.28.56-.35.75-.35h.53c.17 0 .4-.01.62.48.24.54.81 1.87.88 2.01.07.14.12.3.02.49-.1.19-.15.3-.29.46-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.75 1.24 1.62 2 .84.74 1.55 1.02 1.85 1.13.29.11.46.09.63-.06.18-.15.75-.87.95-1.17.2-.3.4-.25.66-.15.27.1 1.71.81 2 .96.29.15.48.22.55.35.07.13.07.75-.17 1.43Z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function StoreFooter({ restaurant }: { restaurant: Restaurant }) {
  const year = new Date().getFullYear();
  const whatsappUrl = restaurant.whatsapp ? buildWhatsappUrl(restaurant.whatsapp) : null;
  const instagramUrl = restaurant.instagram ? buildInstagramUrl(restaurant.instagram) : null;

  return (
    <footer className="border-t border-[var(--store-border)] bg-[var(--store-category-bg)]">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-8 text-center sm:py-10">
        {restaurant.logo_url ? (
          <div className="relative h-14 w-full max-w-[180px]">
            <ImageWithFallback
              src={restaurant.logo_url}
              alt={restaurant.name}
              fill
              sizes="180px"
              className="object-contain"
              showLabel={false}
            />
          </div>
        ) : (
          <p className="text-xl font-bold tracking-tight text-[var(--store-text)]">{restaurant.name}</p>
        )}

        <p className="max-w-md text-sm text-[var(--store-text-muted)]">
          {restaurant.name} está no VSFood.{" "}
          <Link
            href="/cadastro?tipo=restaurante"
            className="font-semibold text-[var(--store-primary)] underline-offset-4 hover:underline"
          >
            Crie sua loja também
          </Link>
        </p>

        {(whatsappUrl || instagramUrl) && (
          <div className="flex items-center gap-3">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="grid size-9 place-items-center rounded-full border border-[var(--store-border)] text-[var(--store-text-muted)] transition-colors hover:border-[var(--store-primary)] hover:text-[var(--store-primary)]"
              >
                <WhatsappIcon className="size-4" />
              </a>
            )}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid size-9 place-items-center rounded-full border border-[var(--store-border)] text-[var(--store-text-muted)] transition-colors hover:border-[var(--store-primary)] hover:text-[var(--store-primary)]"
              >
                <InstagramIcon className="size-4" />
              </a>
            )}
          </div>
        )}

        <p className="text-xs text-[var(--store-text-muted)]">
          © {year} VSFood • Desenvolvido por{" "}
          <a
            href="https://visionariodev.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-[var(--store-text)]"
          >
            Visionário Dev
          </a>
        </p>
      </div>
    </footer>
  );
}
