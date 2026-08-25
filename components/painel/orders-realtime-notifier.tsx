"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { playNotificationBeep } from "@/lib/sound";
import { getOrderSoundEnabled } from "@/lib/notification-preferences";

/**
 * Montado uma vez em app/painel/layout.tsx (não em OrdersBoard) — assim o
 * dono recebe som/toast de pedido novo em qualquer página do painel, não só
 * em /painel/pedidos. router.refresh() já re-executa toda a árvore de
 * Server Components da rota atual (layout + página), o que mantém tanto o
 * badge de "novos pedidos" da sidebar quanto a lista do OrdersBoard
 * atualizados — por isso um único canal aqui é suficiente, sem duplicar a
 * assinatura realtime dentro do OrdersBoard.
 */
export function OrdersRealtimeNotifier({ restaurantId }: { restaurantId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`painel-orders-notifier-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        () => {
          if (getOrderSoundEnabled()) playNotificationBeep();
          toast.success("Novo pedido recebido!");
          router.refresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, router]);

  return null;
}
