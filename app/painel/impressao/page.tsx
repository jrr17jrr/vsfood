import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRestaurantMembership } from "@/lib/auth";
import { getRestaurant } from "@/lib/data/painel";
import { listPrintDevicesAction } from "@/lib/actions/painel/print-devices";
import { AutoAcceptCard } from "@/components/painel/print/auto-accept-card";
import { AutoPrintCard } from "@/components/painel/print/auto-print-card";
import { VsfoodPrintCard } from "@/components/painel/print/vsfood-print-card";
import { DevicesCard } from "@/components/painel/print/devices-card";
import { PrintSettingsForm } from "@/components/painel/print/print-settings-form";

export const metadata: Metadata = { title: "Impressão" };

export default async function ImpressaoPage() {
  const { restaurantId } = await requireRestaurantMembership();
  const [restaurant, devices] = await Promise.all([getRestaurant(restaurantId), listPrintDevicesAction()]);
  if (!restaurant) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Impressão</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Configure o aceite automático de pedidos e como suas comandas são impressas.
      </p>

      <div className="mt-6 max-w-2xl space-y-8">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Aceite automático</h2>
          <AutoAcceptCard restaurant={restaurant} />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">VSFood Print</h2>
          <VsfoodPrintCard />
          <AutoPrintCard restaurant={restaurant} hasDevice={devices.length > 0} />
          <DevicesCard devices={devices} />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Preferências da comanda</h2>
          <PrintSettingsForm restaurant={restaurant} />
        </section>
      </div>
    </div>
  );
}
