import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRestaurantMembership } from "@/lib/auth";
import { getRestaurant } from "@/lib/data/painel";
import { AutoAcceptCard } from "@/components/painel/print/auto-accept-card";
import { PrintSettingsForm } from "@/components/painel/print/print-settings-form";

export const metadata: Metadata = { title: "Impressão" };

export default async function ImpressaoPage() {
  const { restaurantId } = await requireRestaurantMembership();
  const restaurant = await getRestaurant(restaurantId);
  if (!restaurant) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Impressão</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Configure o aceite automático de pedidos e como suas comandas são impressas.
      </p>

      <div className="mt-6 max-w-2xl space-y-8">
        <AutoAcceptCard restaurant={restaurant} />
        <PrintSettingsForm restaurant={restaurant} />
      </div>
    </div>
  );
}
