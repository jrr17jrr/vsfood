"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { formatCurrencyBRL } from "@/lib/format";
import { cartItemTotal, cartSubtotal, useCartStore } from "@/lib/store/cart";

export function CartSheet({
  open,
  onOpenChange,
  minOrderValue,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  minOrderValue: number;
}) {
  const items = useCartStore((s) => s.items);
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = cartSubtotal(items);
  const belowMinimum = minOrderValue > 0 && subtotal < minOrderValue;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Seu carrinho</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
            <ShoppingBag className="size-10" />
            <p className="font-medium text-foreground">Seu carrinho está vazio</p>
            <p className="text-sm">Adicione produtos do cardápio para continuar.</p>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto px-4">
            {items.map((item) => (
              <div key={item.lineId} className="flex gap-3 border-b pb-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.imageUrl && <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{item.name}</p>
                    <button onClick={() => removeItem(item.lineId)} aria-label="Remover item" className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  {item.options.length > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.options.map((o) => o.optionName).join(", ")}
                    </p>
                  )}
                  {item.notes && <p className="mt-0.5 text-xs italic text-muted-foreground">&ldquo;{item.notes}&rdquo;</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 rounded-full border p-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 rounded-full"
                        onClick={() => updateItem(item.lineId, { quantity: Math.max(1, item.quantity - 1) })}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-3 text-center text-xs font-medium">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 rounded-full"
                        onClick={() => updateItem(item.lineId, { quantity: item.quantity + 1 })}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrencyBRL(cartItemTotal(item))}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <SheetFooter className="border-t px-4 pt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground">{formatCurrencyBRL(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Taxa de entrega calculada no checkout.</p>
            {belowMinimum && (
              <p className="text-sm font-medium text-destructive">
                Pedido mínimo: {formatCurrencyBRL(minOrderValue)}
              </p>
            )}
            <Button size="lg" className="mt-1 w-full" disabled={belowMinimum} asChild={!belowMinimum}>
              {belowMinimum ? (
                <span>Falta {formatCurrencyBRL(minOrderValue - subtotal)} para o mínimo</span>
              ) : (
                <Link href="/checkout">Finalizar pedido</Link>
              )}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
