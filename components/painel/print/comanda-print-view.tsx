"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrencyBRL, formatDateTime, formatOptionGroupsSummary, formatOrderNumber } from "@/lib/format";
import { PAYMENT_METHOD_LABEL } from "@/lib/orders/status";
import type { PainelOrderDetail } from "@/lib/data/painel";
import type { Restaurant } from "@/types/database";

const PAGE_SIZE: Record<Restaurant["print_format"], string> = {
  a4: "size: A4; margin: 12mm;",
  "80mm": "size: 80mm auto; margin: 4mm;",
  "58mm": "size: 58mm auto; margin: 3mm;",
};

export function ComandaPrintView({ order, restaurant }: { order: PainelOrderDetail; restaurant: Restaurant }) {
  useEffect(() => {
    window.print();
  }, []);

  const copies = Array.from({ length: restaurant.print_copies });

  return (
    <div className="bg-white text-black">
      <style>{`@page { ${PAGE_SIZE[restaurant.print_format]} }`}</style>

      <div className="print:hidden flex items-center justify-between gap-3 border-b bg-secondary/40 p-4">
        <p className="text-sm text-muted-foreground">Pré-visualização da comanda — o diálogo de impressão deve abrir automaticamente.</p>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="size-4" />
          Imprimir
        </Button>
      </div>

      {copies.map((_, copyIndex) => (
        <div
          key={copyIndex}
          className="mx-auto max-w-md p-6 font-mono text-sm text-black print:max-w-none"
          style={copyIndex < copies.length - 1 ? { pageBreakAfter: "always" } : undefined}
        >
          <div className="text-center">
            <p className="text-base font-bold">{restaurant.name}</p>
            {restaurant.print_show_phone && restaurant.phone && <p>{restaurant.phone}</p>}
          </div>

          <div className="mt-3 border-t border-dashed border-black pt-2">
            <p className="font-bold">Pedido {formatOrderNumber(order.number)}</p>
            <p>{formatDateTime(order.created_at)}</p>
            <p>Cliente: {order.customer_name}</p>
            <p className="font-bold">{order.delivery_type === "delivery" ? "ENTREGA" : "RETIRADA"}</p>
          </div>

          <div className="mt-3 space-y-2 border-t border-dashed border-black pt-2">
            {order.items.map((item) => (
              <div key={item.id}>
                <div className="flex justify-between gap-2">
                  <span>
                    {item.quantity}x {item.name_snapshot}
                  </span>
                  {restaurant.print_show_prices && <span>{formatCurrencyBRL(item.subtotal)}</span>}
                </div>
                {item.options.length > 0 &&
                  formatOptionGroupsSummary(
                    item.options.map((o) => ({
                      groupName: o.group_name_snapshot,
                      optionName: o.option_name_snapshot,
                      price: o.price_snapshot,
                    })),
                  ).map((line) => (
                    <p key={line} className="pl-3 text-xs">
                      {line}
                    </p>
                  ))}
                {item.notes && <p className="pl-3 text-xs italic">&quot;{item.notes}&quot;</p>}
              </div>
            ))}
          </div>

          {order.notes && restaurant.print_show_notes && (
            <div className="mt-3 border-t border-dashed border-black pt-2">
              <p className="font-bold">Observações do pedido</p>
              <p>{order.notes}</p>
            </div>
          )}

          {order.delivery_type === "delivery" && order.address_snapshot && restaurant.print_show_address && (
            <div className="mt-3 border-t border-dashed border-black pt-2">
              <p className="font-bold">Endereço</p>
              <p>
                {order.address_snapshot.street}, {order.address_snapshot.number}
                {order.address_snapshot.complement ? ` - ${order.address_snapshot.complement}` : ""}
              </p>
              <p>
                {order.address_snapshot.neighborhood}, {order.address_snapshot.city}
                {order.address_snapshot.state ? `/${order.address_snapshot.state}` : ""}
              </p>
              {order.address_snapshot.reference && <p>Ref: {order.address_snapshot.reference}</p>}
            </div>
          )}

          <div className="mt-3 border-t border-dashed border-black pt-2">
            <p>Pagamento: {PAYMENT_METHOD_LABEL[order.payment_method]}</p>
            {order.change_for && restaurant.print_show_prices && <p>Troco para {formatCurrencyBRL(order.change_for)}</p>}
          </div>

          {restaurant.print_show_prices && (
            <div className="mt-3 space-y-0.5 border-t border-dashed border-black pt-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrencyBRL(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span>Desconto</span>
                  <span>-{formatCurrencyBRL(order.discount)}</span>
                </div>
              )}
              {order.delivery_type === "delivery" && (
                <div className="flex justify-between">
                  <span>Entrega</span>
                  <span>{formatCurrencyBRL(order.delivery_fee)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatCurrencyBRL(order.total)}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
