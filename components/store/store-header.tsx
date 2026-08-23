import Image from "next/image";
import { Clock, Truck, Wallet } from "lucide-react";
import type { Restaurant } from "@/types/database";
import type { OpenStatus } from "@/lib/opening-hours";
import { formatCurrencyBRL } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

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
    <div>
      {/*
        aspect-ratio em vez de altura fixa: a arte inteira do banner cabe no
        container em qualquer largura de tela. object-contain no mobile evita
        cortar texto/elementos importantes de uma arte larga num viewport
        estreito; a partir de sm a proporção já favorece object-cover sem
        recorte agressivo. max-h evita o banner ficar gigante em telas muito
        largas (o container é full-bleed, sem max-width).
      */}
      <div className="relative aspect-[8/3] w-full overflow-hidden bg-muted sm:max-h-[480px]">
        {restaurant.banner_url ? (
          <Image
            src={restaurant.banner_url}
            alt=""
            fill
            sizes="100vw"
            className="object-contain sm:object-cover"
            priority
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-brand-orange to-brand-red" />
        )}
      </div>

      <div className="mx-auto max-w-4xl px-4">
        <div className="-mt-10 flex items-end gap-4 sm:-mt-12">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-card p-2 shadow-md sm:size-24">
            {restaurant.logo_url ? (
              <Image src={restaurant.logo_url} alt={restaurant.name} fill sizes="96px" className="object-contain" />
            ) : (
              <div className="grid size-full place-items-center bg-secondary text-2xl font-bold text-secondary-foreground">
                {restaurant.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{restaurant.name}</h1>
          <Badge variant={isReallyOpen ? "default" : "secondary"} className={isReallyOpen ? "bg-primary" : ""}>
            {isReallyOpen ? "Aberto" : "Fechado"}
          </Badge>
        </div>
        {restaurant.description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{restaurant.description}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
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
