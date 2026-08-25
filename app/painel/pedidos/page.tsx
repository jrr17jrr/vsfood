import type { Metadata } from "next";
import { requireRestaurantMembership } from "@/lib/auth";
import { getPainelOrders } from "@/lib/data/painel";
import { OrdersBoard } from "@/components/painel/orders-board";

export const metadata: Metadata = { title: "Pedidos" };

export default async function PainelPedidosPage() {
  const { restaurantId } = await requireRestaurantMembership();
  const orders = await getPainelOrders(restaurantId);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
      <p className="mt-1 text-sm text-muted-foreground">Acompanhe e gerencie os pedidos em tempo real.</p>
      <div className="mt-6">
        <OrdersBoard orders={orders} />
      </div>
    </div>
  );
}
