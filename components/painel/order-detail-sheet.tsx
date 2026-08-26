"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, RotateCcw, Store, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrencyBRL, formatDateTime, formatOptionGroupsSummary, formatOrderNumber } from "@/lib/format";
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, PRINT_STATUS_LABEL, shouldShowPrintBadge } from "@/lib/orders/status";
import { requestReprintAction } from "@/lib/actions/painel/print";
import type { OrderItem, OrderItemOption, Restaurant } from "@/types/database";
import type { PainelOrder } from "@/lib/data/painel";

export function OrderDetailSheet({
  order,
  restaurant,
  onOpenChange,
}: {
  order: PainelOrder | null;
  restaurant: Restaurant;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [items, setItems] = useState<(OrderItem & { options: OrderItemOption[] })[] | null>(null);
  const [reprinting, setReprinting] = useState(false);

  async function handleReprint() {
    if (!order) return;
    setReprinting(true);
    const result = await requestReprintAction(order.id);
    setReprinting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Pedido recolocado na fila de impressão.");
    router.refresh();
  }

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
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={order.delivery_type === "delivery" ? "" : "bg-secondary text-secondary-foreground"}>
                  {order.delivery_type === "delivery" ? (
                    <>
                      <Truck className="size-3.5" /> ENTREGA
                    </>
                  ) : (
                    <>
                      <Store className="size-3.5" /> RETIRADA NO LOCAL
                    </>
                  )}
                </Badge>
                {order.estimated_time_minutes != null && (
                  <span className="text-xs text-muted-foreground">~{order.estimated_time_minutes} min</span>
                )}
                {shouldShowPrintBadge(order.print_status, restaurant.auto_print_enabled) && (
                  <Badge variant="outline">{PRINT_STATUS_LABEL[order.print_status]}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{formatDateTime(order.created_at)}</p>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/painel/pedidos/${order.id}/imprimir`} target="_blank" rel="noopener noreferrer">
                    <Printer className="size-4" />
                    Imprimir
                  </Link>
                </Button>
                <Button size="sm" variant="outline" disabled={reprinting} onClick={handleReprint}>
                  <RotateCcw className="size-4" />
                  {reprinting ? "Reimprimindo..." : "Reimprimir pedido"}
                </Button>
              </div>
              {!restaurant.auto_print_enabled && (
                <p className="text-xs text-muted-foreground">Nenhum dispositivo de impressão conectado ainda.</p>
              )}

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
                          <div className="text-xs text-muted-foreground">
                            {formatOptionGroupsSummary(
                              item.options.map((o) => ({
                                groupName: o.group_name_snapshot,
                                optionName: o.option_name_snapshot,
                                price: o.price_snapshot,
                              })),
                            ).map((line) => (
                              <p key={line}>{line}</p>
                            ))}
                          </div>
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
