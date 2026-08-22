"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrencyBRL, formatDateTime, formatOrderNumber } from "@/lib/format";
import { PAYMENT_STATUS_LABEL } from "@/lib/orders/status";
import type { OrderItem, OrderItemOption } from "@/types/database";
import type { PainelOrder } from "@/lib/data/painel";

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  pix_online: "PIX (online)",
  card_online: "Cartão (online)",
  pix_manual: "PIX manual",
  cash: "Dinheiro",
  card_on_delivery: "Cartão na entrega",
};

export function OrderDetailSheet({ order, onOpenChange }: { order: PainelOrder | null; onOpenChange: (open: boolean) => void }) {
  const [items, setItems] = useState<(OrderItem & { options: OrderItemOption[] })[] | null>(null);

  useEffect(() => {
    if (!order) return;
    let cancelled = false;
    const supabase = createClient();
    (async () => {
      const { data: orderItems } = await supabase.from("order_items").select("*").eq("order_id", order.id);
      const ids = (orderItems ?? []).map((i) => i.id);
      const { data: options } = ids.length
        ? await supabase.from("order_item_options").select("*").in("order_item_id", ids)
        : { data: [] };
      if (cancelled) return;
      setItems((orderItems ?? []).map((i) => ({ ...i, options: (options ?? []).filter((o) => o.order_item_id === i.id) })));
    })();
    return () => {
      cancelled = true;
    };
  }, [order]);

  return (
    <Sheet open={!!order} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {order && (
          <>
            <SheetHeader>
              <SheetTitle>
                Pedido {formatOrderNumber(order.number)} · {order.customer_name}
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-4 px-4 pb-6">
              <p className="text-sm text-muted-foreground">{formatDateTime(order.created_at)}</p>

              {items === null ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-3 text-sm">
                      <div>
                        <p className="font-medium">
                          {item.quantity}x {item.name_snapshot}
                        </p>
                        {item.options.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {item.options.map((o) => o.option_name_snapshot).join(", ")}
                          </p>
                        )}
                        {item.notes && <p className="text-xs italic text-muted-foreground">&ldquo;{item.notes}&rdquo;</p>}
                      </div>
                      <span className="shrink-0 font-medium">{formatCurrencyBRL(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1 border-t pt-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrencyBRL(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Desconto</span>
                    <span>-{formatCurrencyBRL(order.discount)}</span>
                  </div>
                )}
                {order.delivery_type === "delivery" && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Entrega</span>
                    <span>{formatCurrencyBRL(order.delivery_fee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatCurrencyBRL(order.total)}</span>
                </div>
              </div>

              <div className="space-y-1 border-t pt-3 text-sm text-muted-foreground">
                <p>
                  {order.delivery_type === "delivery" ? "Entrega" : "Retirada no local"} ·{" "}
                  {PAYMENT_METHOD_LABEL[order.payment_method]} · {PAYMENT_STATUS_LABEL[order.payment_status]}
                </p>
                {order.address_snapshot && (
                  <p>
                    {order.address_snapshot.street}, {order.address_snapshot.number}
                    {order.address_snapshot.complement ? ` - ${order.address_snapshot.complement}` : ""} ·{" "}
                    {order.address_snapshot.neighborhood}, {order.address_snapshot.city}
                  </p>
                )}
                {order.change_for && <p>Troco para {formatCurrencyBRL(order.change_for)}</p>}
                {order.customer_whatsapp && <p>WhatsApp: {order.customer_whatsapp}</p>}
                {order.notes && <p>Obs: {order.notes}</p>}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
