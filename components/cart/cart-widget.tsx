"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrencyBRL } from "@/lib/format";
import { cartItemCount, cartSubtotal, useCartStore } from "@/lib/store/cart";
import { CartSheet } from "./cart-sheet";

export function CartWidget({ minOrderValue }: { minOrderValue: number }) {
  const [open, setOpen] = useState(false);
  const items = useCartStore((s) => s.items);
  const count = cartItemCount(items);
  const subtotal = cartSubtotal(items);

  if (count === 0) {
    return <CartSheet open={open} onOpenChange={setOpen} minOrderValue={minOrderValue} />;
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--store-border)] bg-[var(--store-header)] p-3 sm:hidden">
        <Button
          size="lg"
          className="w-full justify-between px-5"
          style={{ backgroundColor: "var(--store-button)", color: "var(--store-button-text)" }}
          onClick={() => setOpen(true)}
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="size-4" />
            Ver carrinho • {count} {count === 1 ? "item" : "itens"}
          </span>
          <span>{formatCurrencyBRL(subtotal)}</span>
        </Button>
      </div>

      <Button
        size="lg"
        onClick={() => setOpen(true)}
        style={{ backgroundColor: "var(--store-button)", color: "var(--store-button-text)" }}
        className="fixed right-6 bottom-6 z-40 hidden gap-2 rounded-full px-5 shadow-lg sm:flex"
      >
        <ShoppingBag className="size-4" />
        {count} {count === 1 ? "item" : "itens"} • {formatCurrencyBRL(subtotal)}
      </Button>

      <CartSheet open={open} onOpenChange={setOpen} minOrderValue={minOrderValue} />
    </>
  );
}
