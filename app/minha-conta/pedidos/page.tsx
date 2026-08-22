import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { requireCustomer } from "@/lib/auth";
import { getCustomerOrders } from "@/lib/data/account";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyBRL, formatDateTime, formatOrderNumber } from "@/lib/format";
import { ORDER_STATUS_LABEL } from "@/lib/orders/status";

export const metadata: Metadata = { title: "Meus pedidos" };

export default async function PedidosPage() {
  const profile = await requireCustomer();
  const orders = await getCustomerOrders(profile.id);

  return (
    <div>
      <h2 className="text-lg font-semibold">Meus pedidos</h2>
      <p className="mt-1 text-sm text-muted-foreground">Histórico de pedidos em todos os restaurantes.</p>

      {orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-muted-foreground">
          <ShoppingBag className="size-8" />
          <p className="font-medium text-foreground">Nenhum pedido ainda</p>
          <p className="text-sm">Quando você fizer seu primeiro pedido, ele aparecerá aqui.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/pedido/${order.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{order.restaurant_name}</p>
                  <span className="text-xs text-muted-foreground">{formatOrderNumber(order.number)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrencyBRL(order.total)}</p>
                <Badge variant="secondary" className="mt-1">
                  {ORDER_STATUS_LABEL[order.status]}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
