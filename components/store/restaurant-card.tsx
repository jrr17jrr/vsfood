import Link from "next/link";
import Image from "next/image";
import { Clock, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyBRL } from "@/lib/format";
import type { MarketplaceRestaurant } from "@/lib/data/marketplace";

export function RestaurantCard({ restaurant }: { restaurant: MarketplaceRestaurant }) {
  return (
    <Link
      href={`/loja/${restaurant.slug}`}
      className="group overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative h-32 w-full bg-muted">
        {restaurant.banner_url ? (
          <Image src={restaurant.banner_url} alt="" fill sizes="400px" className="object-cover" />
        ) : (
          <div className="size-full bg-gradient-to-br from-brand-orange to-brand-red" />
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={restaurant.isOpen ? "default" : "secondary"} className={restaurant.isOpen ? "bg-primary" : ""}>
            {restaurant.isOpen ? "Aberto" : "Fechado"}
          </Badge>
        </div>
        <div className="absolute -bottom-6 left-4 size-14 overflow-hidden rounded-xl border-4 border-card bg-card shadow">
          {restaurant.logo_url ? (
            <Image src={restaurant.logo_url} alt={restaurant.name} width={56} height={56} className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center bg-secondary font-bold text-secondary-foreground">
              {restaurant.name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 pt-8">
        <p className="font-semibold group-hover:text-primary">{restaurant.name}</p>
        {restaurant.cuisine_type && <p className="text-xs text-muted-foreground">{restaurant.cuisine_type}</p>}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {restaurant.estimated_time_minutes} min
          </span>
          <span className="flex items-center gap-1">
            <Truck className="size-3.5" />
            {restaurant.minDeliveryFee === null
              ? "Consulte a taxa"
              : restaurant.minDeliveryFee === 0
                ? "Grátis"
                : formatCurrencyBRL(restaurant.minDeliveryFee)}
          </span>
        </div>
      </div>
    </Link>
  );
}
