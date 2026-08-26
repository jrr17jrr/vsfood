"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Laptop, Plus, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generatePairingCodeAction, revokeDeviceAction } from "@/lib/actions/painel/print-devices";
import type { PrintDevice } from "@/types/database";

const ONLINE_THRESHOLD_MS = 90_000; // heartbeat a cada 30-60s + margem

function isOnline(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "nunca";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `há ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

export function DevicesCard({ devices }: { devices: PrintDevice[] }) {
  const router = useRouter();
  const [pairing, setPairing] = useState<{ code: string; expiresAt: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Sem WebSocket: refresca sozinho pra online/offline e o pareamento recém-concluído aparecerem sem F5.
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    if (!pairing) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.round((new Date(pairing.expiresAt).getTime() - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [pairing]);

  async function handleGenerateCode() {
    setGenerating(true);
    const result = await generatePairingCodeAction();
    setGenerating(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setPairing(result);
  }

  async function handleRevoke(deviceId: string) {
    const result = await revokeDeviceAction(deviceId);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Dispositivo revogado.");
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Dispositivos conectados</p>
          <p className="text-xs text-muted-foreground">Computadores com o VSFood Print pareados a essa loja.</p>
        </div>
        <Button type="button" size="sm" onClick={handleGenerateCode} disabled={generating}>
          <Plus className="size-4" />
          Conectar dispositivo
        </Button>
      </div>

      {devices.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhum computador conectado.
          <br />
          Instale o VSFood Print pra habilitar a impressão automática.
        </div>
      ) : (
        <div className="space-y-2">
          {devices.map((device) => {
            const online = isOnline(device.last_seen_at);
            return (
              <div key={device.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Laptop className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{device.name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {online ? (
                        <Wifi className="size-3 text-emerald-500" />
                      ) : (
                        <WifiOff className="size-3" />
                      )}
                      {online ? "Online agora" : `Offline · última atividade ${relativeTime(device.last_seen_at)}`}
                      {device.platform ? ` · ${device.platform}` : ""}
                    </p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost">
                      Revogar acesso
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revogar este dispositivo?</AlertDialogTitle>
                      <AlertDialogDescription>
                        &quot;{device.name}&quot; para de conseguir buscar e confirmar impressões imediatamente. Você pode
                        conectar novamente depois com um novo código.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleRevoke(device.id)}>Revogar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={pairing != null} onOpenChange={(open) => !open && setPairing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectar dispositivo</DialogTitle>
            <DialogDescription>Abra o VSFood Print no computador da loja e digite o código abaixo.</DialogDescription>
          </DialogHeader>
          {pairing && (
            <div className="flex flex-col items-center gap-3 py-4">
              <p className="text-4xl font-bold tracking-[0.2em]">{pairing.code}</p>
              <Badge variant={secondsLeft > 0 ? "secondary" : "destructive"}>
                {secondsLeft > 0 ? `Expira em ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}` : "Expirado — gere um novo código"}
              </Badge>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
