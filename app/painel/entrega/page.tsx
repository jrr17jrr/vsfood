import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRestaurantMembership } from "@/lib/auth";
import { getRestaurant } from "@/lib/data/painel";
import { createClient } from "@/lib/supabase/server";
import { DeliverySettingsForm } from "@/components/painel/delivery-settings-form";
import { DeliveryZonesManager } from "@/components/painel/delivery-zones-manager";

export const metadata: Metadata = { title: "Entrega" };

export default async function EntregaPage() {
  const { restaurantId } = await requireRestaurantMembership();
  const restaurant = await getRestaurant(restaurantId);
  if (!restaurant) notFound();

  const supabase = await createClient();
  const { data: zones } = await supabase
    .from("delivery_zones")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("order");

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Entrega e retirada</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Configure como sua loja recebe pedidos para entrega e retirada no local.
      </p>

      <div className="mt-6 max-w-2xl space-y-8">
        <section>
          <h2 className="mb-3 text-base font-semibold">Configurações gerais</h2>
          <DeliverySettingsForm restaurant={restaurant} />
        </section>

        <section>
          <h2 className="mb-1 text-base font-semibold">Áreas de entrega</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Defina a taxa por bairro. Pedido mínimo e tempo estimado por região são opcionais — quando vazios, usam a
            configuração geral acima.
          </p>
          <DeliveryZonesManager zones={zones ?? []} />
        </section>
      </div>
    </div>
  );
}
