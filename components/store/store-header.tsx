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
        Padrão oficial do banner VSFood: 1920×600px, proporção 16:5 — mesmo
        aspect-ratio no mobile e no desktop (consistência de ponta a ponta
        com o preview de /painel/aparencia), sempre com object-cover: uma
        arte 1920x600 bem enquadrada nunca precisa de "tarja" vazia, só um
        crop leve nas laterais em telas muito estreitas ou muito largas.
        max-h evita o banner ficar gigante em telas muito largas (o container
        é full-bleed, sem max-width).
      */}
      <div className="relative aspect-[16/5] w-full overflow-hidden bg-gradient-to-br from-[var(--store-primary)] to-[var(--store-secondary)] sm:max-h-[320px]">
        {restaurant.banner_url && (
          <ImageWithFallback
            src={restaurant.banner_url}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
            showLabel={false}
            priority
          />
        )}
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-4 sm:pb-5">
        <div className="-mt-[42px] flex items-end gap-4 sm:-mt-[52px]">
          {/*
            Só a imagem + radius — sem card, sem fundo, sem padding, sem
            sombra. Nada aqui além de overflow-hidden + rounded-2xl; qualquer
            "halo" claro que ainda apareça vem do próprio arquivo da logo
            (canvas branco embutido no PNG), não deste wrapper. -mt exatamente
            metade do size (84/2, 104/2) pra manter a metade sobre o banner e
            a metade sobre o conteúdo em qualquer um dos dois tamanhos.
          */}
          <div className="relative size-[84px] shrink-0 overflow-hidden rounded-2xl sm:size-[104px]">
            {restaurant.logo_url ? (
              <ImageWithFallback
                src={restaurant.logo_url}
                alt={restaurant.name}
                fill
                sizes="(min-width: 640px) 104px, 84px"
                className="object-cover"
                showLabel={false}
              />
            ) : (
              <div className="grid size-full place-items-center bg-[var(--store-primary)] text-2xl font-bold text-[var(--store-button-text)]">
                {restaurant.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl font-bold tracking-tight text-[var(--store-text)] sm:text-2xl">{restaurant.name}</h1>
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

        <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-[var(--store-text-muted)]">
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
