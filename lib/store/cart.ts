"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartSelectedOption = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  /** Valor já resolvido pela regra de cobrança do grupo (calculateGroupCharges) — não é o preço bruto da opção. */
  price: number;
};

export type CartItem = {
  lineId: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  unitBasePrice: number;
  quantity: number;
  notes: string;
  options: CartSelectedOption[];
};

type CartState = {
  restaurantId: string | null;
  restaurantSlug: string | null;
  items: CartItem[];
  setRestaurant: (restaurantId: string, restaurantSlug: string) => void;
  addItem: (item: Omit<CartItem, "lineId">) => void;
  updateItem: (lineId: string, patch: Partial<Pick<CartItem, "quantity" | "notes">>) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
};

function lineTotal(item: Pick<CartItem, "unitBasePrice" | "options" | "quantity">): number {
  const optionsTotal = item.options.reduce((sum, o) => sum + o.price, 0);
  return (item.unitBasePrice + optionsTotal) * item.quantity;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantSlug: null,
      items: [],

      setRestaurant: (restaurantId, restaurantSlug) => {
        const current = get();
        if (current.restaurantId && current.restaurantId !== restaurantId) {
          set({ restaurantId, restaurantSlug, items: [] });
        } else {
          set({ restaurantId, restaurantSlug });
        }
      },

      addItem: (item) => {
        const lineId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`;
        set({ items: [...get().items, { ...item, lineId }] });
      },

      updateItem: (lineId, patch) => {
        set({
          items: get().items.map((i) => (i.lineId === lineId ? { ...i, ...patch } : i)),
        });
      },

      removeItem: (lineId) => {
        set({ items: get().items.filter((i) => i.lineId !== lineId) });
      },

      clearCart: () => set({ items: [] }),
    }),
    { name: "vsfood-cart" },
  ),
);

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartItemTotal(item: CartItem): number {
  return lineTotal(item);
}
