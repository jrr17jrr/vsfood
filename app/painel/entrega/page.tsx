import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRestaurantMembership } from "@/lib/auth";
import { getRestaurant } from "@/lib/data/painel";
import { createClient } from "@/lib/supabase/server";
import { DeliverySettingsForm } from "@/components/painel/delivery-settings-form";
import { DeliveryStatusCards } from "@/components/painel/delivery/delivery-status-cards";
import { DeliveryAreaPicker } from "@/components/painel/delivery/delivery-area-picker";

export const metadata: Metadata = { title: "Entrega" };

export default async function EntregaPage() {
  const { restaurantId } = await requireRestaurantMembership();
  const restaurant = await getRestaurant(restaurantId);
  if (!restaurant) notFound();

  const supabase = await createClient();
  const [{ data: zones }, { data: tiers }] = await Promise.all([
    supabase.from("delivery_zones").select("*").eq("restaurant_id", restaurantId).order("order"),
    supabase.from("delivery_distance_tiers").select("*").eq("restaurant_id", restaurantId).order("order"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Entrega e retirada</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Configure como sua loja recebe pedidos para entrega e retirada no local.
      </p>

      <div className="mt-6 max-w-3xl space-y-8">
        <DeliveryStatusCards restaurant={restaurant} />
        <DeliveryAreaPicker restaurant={restaurant} zones={zones ?? []} tiers={tiers ?? []} />
        <DeliverySettingsForm restaurant={restaurant} />
      </div>
    </div>
  );
}
