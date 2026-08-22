import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRestaurantMembership } from "@/lib/auth";
import { getRestaurant } from "@/lib/data/painel";
import { AppearanceForm } from "@/components/painel/appearance-form";
import { QrCodeCard } from "@/components/painel/qr-code-card";

export const metadata: Metadata = { title: "Aparência" };

export default async function AparenciaPage() {
  const { restaurantId } = await requireRestaurantMembership();
  const restaurant = await getRestaurant(restaurantId);
  if (!restaurant) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Aparência da loja</h1>
      <p className="mt-1 text-sm text-muted-foreground">As alterações refletem automaticamente na sua página pública.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <AppearanceForm restaurant={restaurant} />
        <QrCodeCard slug={restaurant.slug} />
      </div>
    </div>
  );
}
