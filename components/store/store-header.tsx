import { Clock, Truck, Wallet } from "lucide-react";
import type { Restaurant } from "@/types/database";
import type { OpenStatus } from "@/lib/opening-hours";
import { formatCurrencyBRL } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";

export function StoreHeader({
  restaurant,
  openStatus,
  minDeliveryFee,
}: {
  restaurant: Restaurant;
  openStatus: OpenStatus;
  minDeliveryFee: number | null;
}) {
  const isReallyOpen = openStatus.isOpen && !restaurant.orders_paused;

  return (
    <div className="bg-[var(--store-header)]">
      {/*
        Ratio por breakpoint em vez de um único aspect-ratio: no mobile
        (< sm) um container mais largo que alto (ex: 8/3) espreme demais uma
        arte horizontal com pouca altura útil — aspect-[3/2] dá mais altura
        pra ler a arte sem ficar achatado. object-cover + object-center (em
        vez de object-contain) prioriza o centro da arte, que é onde a marca/
        texto principal normalmente está, sem barras vazias de contain. A
        partir de sm a proporção mais larga (8/3) já cabe bem com cover.
        max-h evita o banner ficar gigante em telas muito largas (o container
        é full-bleed, sem max-width).
      */}
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-[var(--store-category-bg)] sm:aspect-[8/3] sm:max-h-[480px]">
        {restaurant.banner_url ? (
          <ImageWithFallback
            src={restaurant.banner_url}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
            showLabel={false}
            priority
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-[var(--store-primary)] to-[var(--store-secondary)]" />
        )}
      </div>

      <div className="mx-auto max-w-4xl px-4">
        <div className="-mt-12 flex items-end gap-4">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border-4 border-[var(--store-header)] bg-[var(--store-card)] p-2 shadow-md sm:size-24">
            {restaurant.logo_url ? (
              <ImageWithFallback
                src={restaurant.logo_url}
                alt={restaurant.name}
                fill
                sizes="96px"
                className="object-contain"
                showLabel={false}
              />
            ) : (
              <div className="grid size-full place-items-center bg-[var(--store-primary)] text-2xl font-bold text-[var(--store-button-text)]">
                {restaurant.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--store-text)]">{restaurant.name}</h1>
          <Badge
            variant={isReallyOpen ? "default" : "secondary"}
            className={isReallyOpen ? "bg-[var(--store-primary)] text-[var(--store-button-text)]" : ""}
          >
            {isReallyOpen ? "Aberto" : "Fechado"}
          </Badge>
        </div>
        {restaurant.description && (
          <p className="mt-1 max-w-2xl text-sm text-[var(--store-text-muted)]">{restaurant.description}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-[var(--store-text-muted)]">
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" />
            {isReallyOpen ? `${restaurant.estimated_time_minutes} min` : openStatus.nextOpening ? `Abre ${openStatus.nextOpening}` : "Fechado no momento"}
          </span>
          <span className="flex items-center gap-1.5">
            <Truck className="size-4" />
            {minDeliveryFee === null ? "Consulte a taxa" : minDeliveryFee === 0 ? "Entrega grátis" : `A partir de ${formatCurrencyBRL(minDeliveryFee)}`}
          </span>
          {restaurant.min_order_value > 0 && (
            <span className="flex items-center gap-1.5">
              <Wallet className="size-4" />
              Pedido mínimo {formatCurrencyBRL(restaurant.min_order_value)}
            </span>
          )}
        </div>

        {!isReallyOpen && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {restaurant.orders_paused
              ? "Estamos com os pedidos pausados no momento. Volte em breve."
              : openStatus.nextOpening
                ? `Estamos fechados no momento. Abrimos ${openStatus.nextOpening}.`
                : "Estamos fechados no momento."}
          </div>
        )}
      </div>
    </div>
  );
}
