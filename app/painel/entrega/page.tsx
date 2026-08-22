import type { Metadata } from "next";
import { requireRestaurantMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DeliveryZonesManager } from "@/components/painel/delivery-zones-manager";

export const metadata: Metadata = { title: "Entrega" };

export default async function EntregaPage() {
  const { restaurantId } = await requireRestaurantMembership();
  const supabase = await createClient();
  const { data: zones } = await supabase
    .from("delivery_zones")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("neighborhood");

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Taxas de entrega</h1>
      <p className="mt-1 text-sm text-muted-foreground">Defina a taxa de entrega por bairro.</p>
      <div className="mt-6 max-w-xl">
        <DeliveryZonesManager zones={zones ?? []} />
      </div>
    </div>
  );
}
