"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyBRL, formatOrderNumber, formatTime } from "@/lib/format";
import { ORDER_STATUS_LABEL, PRINT_STATUS_LABEL, nextStatusOptions, shouldShowPrintBadge } from "@/lib/orders/status";
import { updateOrderStatusAction } from "@/lib/actions/painel/orders";
import { OrderDetailSheet } from "./order-detail-sheet";
import type { PainelOrder } from "@/lib/data/painel";
import type { OrderStatus, Restaurant } from "@/types/database";

const STATUS_ACTION_LABEL: Record<OrderStatus, string> = {
  new: "Aceitar",
  accepted: "Iniciar preparo",
  preparing: "Avançar",
  out_for_delivery: "Marcar finalizado",
  ready_for_pickup: "Marcar retirado",
  completed: "Finalizado",
  rejected: "Recusado",
  cancelled: "Cancelado",
};

export function OrdersBoard({ orders, restaurant }: { orders: PainelOrder[]; restaurant: Restaurant }) {
  const router = useRouter();
  const [selected, setSelected] = useState<PainelOrder | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    setPending(orderId);
    const result = await updateOrderStatusAction(orderId, status);
    setPending(null);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
        <ClipboardList className="size-8" />
        <p className="font-medium text-foreground">Nenhum pedido ainda</p>
        <p className="text-sm">Quando seu primeiro pedido chegar, ele aparecerá aqui.</p>
      </div>
    );
  }

  const newOrders = orders.filter((o) => o.status === "new");
  const activeOrders = orders.filter((o) => !["new", "completed", "rejected", "cancelled"].includes(o.status));
  const pastOrders = orders.filter((o) => ["completed", "rejected", "cancelled"].includes(o.status));

  function OrderCard({ order, highlight }: { order: PainelOrder; highlight?: boolean }) {
    const options = nextStatusOptions(order.status, order.delivery_type);
    const advance = options[0];

    return (
      <div
        className={
          highlight
            ? "rounded-2xl border-2 border-primary bg-primary/5 p-4 shadow-sm"
            : "rounded-2xl border bg-card p-4"
        }
      >
        <button className="w-full text-left" onClick={() => setSelected(order)}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">
                {formatOrderNumber(order.number)} · {order.customer_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTime(order.created_at)} · {order.delivery_type === "delivery" ? "Entrega" : "Retirada"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="secondary">{ORDER_STATUS_LABEL[order.status]}</Badge>
              {shouldShowPrintBadge(order.print_status, restaurant.auto_print_enabled) && (
                <Badge variant="outline" className="text-[10px]">
                  {PRINT_STATUS_LABEL[order.print_status]}
                </Badge>
              )}
            </div>
          </div>
          <p className="mt-2 font-semibold text-primary">{formatCurrencyBRL(order.total)}</p>
        </button>

        {order.status === "new" ? (
          <div className="mt-3 flex gap-2">
            <Button size="sm" className="flex-1" disabled={pending === order.id} onClick={() => handleStatusChange(order.id, "accepted")}>
              Aceitar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={pending === order.id}
              onClick={() => handleStatusChange(order.id, "rejected")}
            >
              Recusar
            </Button>
          </div>
        ) : (
          advance && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full"
              disabled={pending === order.id}
              onClick={() => handleStatusChange(order.id, advance)}
            >
              {STATUS_ACTION_LABEL[order.status]}
            </Button>
          )
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {newOrders.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-primary">Novos pedidos</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {newOrders.map((o) => (
              <OrderCard key={o.id} order={o} highlight />
            ))}
          </div>
        </section>
      )}

      {activeOrders.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">Em andamento</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeOrders.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        </section>
      )}

      {pastOrders.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-muted-foreground">Finalizados</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pastOrders.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        </section>
      )}

      <OrderDetailSheet
        key={selected?.id}
        order={selected}
        restaurant={restaurant}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}
