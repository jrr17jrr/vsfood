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
        pra ler a arte sem ficar achatado. No mobile usamos object-contain
        pra nunca cortar texto/logo importantes nas laterais; o gradiente de
        fundo (cores da loja) preenche o espaço que sobrar dos "tarjas"
        vazias do contain. A partir de sm a proporção mais larga (8/3) cabe
        bem com object-cover, então voltamos a cobrir o container inteiro.
        max-h evita o banner ficar gigante em telas muito largas (o container
        é full-bleed, sem max-width).
      */}
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-gradient-to-br from-[var(--store-primary)] to-[var(--store-secondary)] sm:aspect-[8/3] sm:max-h-[480px]">
        {restaurant.banner_url && (
          <ImageWithFallback
            src={restaurant.banner_url}
            alt=""
            fill
            sizes="100vw"
            className="object-contain object-center sm:object-cover"
            showLabel={false}
            priority
          />
        )}
      </div>

      <div className="mx-auto max-w-4xl px-4">
        <div className="-mt-10 flex items-end gap-4 sm:-mt-14">
          <div className="relative size-[88px] shrink-0 overflow-hidden rounded-2xl border-2 border-[var(--store-header)] bg-white/90 p-1 shadow-sm sm:size-28 sm:p-2">
            {restaurant.logo_url ? (
              <ImageWithFallback
                src={restaurant.logo_url}
                alt={restaurant.name}
                fill
                sizes="(min-width: 640px) 112px, 88px"
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
