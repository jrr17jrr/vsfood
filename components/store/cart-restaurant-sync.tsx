"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/store/cart";

export function CartRestaurantSync({ restaurantId, slug }: { restaurantId: string; slug: string }) {
  const setRestaurant = useCartStore((s) => s.setRestaurant);

  useEffect(() => {
    setRestaurant(restaurantId, slug);
  }, [restaurantId, slug, setRestaurant]);

  return null;
}
