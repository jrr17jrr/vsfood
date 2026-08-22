import type { Metadata } from "next";
import { requireRestaurantMembership } from "@/lib/auth";
import { getConnectionStatus } from "@/lib/mercadopago/connection";
import { MercadoPagoCard } from "@/components/painel/mercadopago-card";

export const metadata: Metadata = { title: "Pagamentos" };

export default async function PagamentosPage() {
  const { restaurantId } = await requireRestaurantMembership();
  const status = await getConnectionStatus(restaurantId);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Pagamentos</h1>
      <p className="mt-1 text-sm text-muted-foreground">Conecte sua conta para receber PIX e cartão online.</p>

      <div className="mt-6">
        <MercadoPagoCard connected={status.connected} connectedAt={status.connectedAt} />
      </div>
    </div>
  );
}
