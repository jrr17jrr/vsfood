"use client";

import { useSyncExternalStore } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getOrderSoundEnabled, setOrderSoundEnabled } from "@/lib/notification-preferences";

// useSyncExternalStore em vez de useState+useEffect: lê o localStorage de
// forma segura pra SSR (getServerSnapshot fixo em `true`, mesmo default de
// antes de existir o toggle) e mantém as duas instâncias do componente
// (sidebar desktop + nav mobile, montadas ao mesmo tempo, só uma visível
// por vez via CSS) sempre em sincronia entre si.
const listeners = new Set<() => void>();
function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}
function notifyListeners() {
  for (const listener of listeners) listener();
}
function getServerSnapshot() {
  return true;
}

/** Liga/desliga o som de "novo pedido" (lib/sound.ts) tocado por OrdersRealtimeNotifier. Preferência por navegador (localStorage), não por conta — não precisa de coluna/tabela nova. */
export function OrderSoundToggle({ className }: { className?: string }) {
  const enabled = useSyncExternalStore(subscribe, getOrderSoundEnabled, getServerSnapshot);

  function toggle() {
    setOrderSoundEnabled(!enabled);
    notifyListeners();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={enabled ? "Desativar som de novos pedidos" : "Ativar som de novos pedidos"}
      title={enabled ? "Som de novos pedidos: ligado" : "Som de novos pedidos: desligado"}
      className={cn("shrink-0", className)}
    >
      {enabled ? <Bell className="size-4" /> : <BellOff className="size-4" />}
    </Button>
  );
}
