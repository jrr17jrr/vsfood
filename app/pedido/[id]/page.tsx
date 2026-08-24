import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrderDetail } from "@/lib/data/account";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { OrderRealtime } from "@/components/orders/order-realtime";
import { PixPaymentCard } from "@/components/orders/pix-payment-card";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyBRL, formatDateTime, formatOptionGroupsSummary, formatOrderNumber } from "@/lib/format";
import { PAYMENT_STATUS_LABEL } from "@/lib/orders/status";

export const metadata: Metadata = { title: "Acompanhar pedido" };

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  pix_online: "PIX (online)",
  card_online: "Cartão (online)",
  pix_manual: "PIX manual",
  cash: "Dinheiro",
  card_on_delivery: "Cartão na entrega",
};

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/pedido/${id}`);

  const order = await getOrderDetail(id);
  if (!order) notFound();

  return (
    <>
      <OrderRealtime orderId={order.id} />
      <PublicHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pedido {formatOrderNumber(order.number)}</p>
              <h1 className="text-2xl font-bold">
                <Link href={`/loja/${order.restaurant_slug}`} className="hover:underline">
                  {order.restaurant_name}
                </Link>
              </h1>
              <p className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
            </div>
            <Badge variant={order.payment_status === "approved" ? "default" : "secondary"}>
              {PAYMENT_STATUS_LABEL[order.payment_status]}
            </Badge>
          </div>

          {order.pix && order.payment_status === "pending" && (
            <div className="mt-6">
              <PixPaymentCard qrCode={order.pix.qrCode} qrCodeBase64={order.pix.qrCodeBase64} />
            </div>
          )}

          <div className="mt-6 rounded-2xl border bg-card p-5">
            <OrderTimeline status={order.status} deliveryType={order.delivery_type} />
          </div>

          <div className="mt-6 rounded-2xl border bg-card p-5">
            <h2 className="font-semibold">Itens do pedido</h2>
            <div className="mt-3 space-y-3">
              {order.items.map((item) => (
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

            <div className="mt-4 space-y-1 border-t pt-4 text-sm">
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
                  <span>Taxa de entrega</span>
                  <span>{formatCurrencyBRL(order.delivery_fee)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatCurrencyBRL(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border bg-card p-5 text-sm">
            <h2 className="font-semibold">Entrega e pagamento</h2>
            <div className="mt-3 space-y-1 text-muted-foreground">
              <p>
                {order.delivery_type === "delivery" ? "Entrega" : "Retirada no local"} · {PAYMENT_METHOD_LABEL[order.payment_method]}
              </p>
              {order.address_snapshot && (
                <p>
                  {order.address_snapshot.street}, {order.address_snapshot.number}
                  {order.address_snapshot.complement ? ` - ${order.address_snapshot.complement}` : ""} ·{" "}
                  {order.address_snapshot.neighborhood}, {order.address_snapshot.city}
                </p>
              )}
              {order.change_for && <p>Troco para {formatCurrencyBRL(order.change_for)}</p>}
              {order.notes && <p>Obs: {order.notes}</p>}
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
