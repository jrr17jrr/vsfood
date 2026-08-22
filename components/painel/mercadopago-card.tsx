"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Wallet } from "lucide-react";
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
import { disconnectMercadoPagoAction } from "@/lib/actions/painel/mercadopago";
import { formatDateTime } from "@/lib/format";

export function MercadoPagoCard({ connected, connectedAt }: { connected: boolean; connectedAt: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDisconnect() {
    setLoading(true);
    const result = await disconnectMercadoPagoAction();
    setLoading(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Mercado Pago desconectado.");
    router.refresh();
  }

  return (
    <div className="max-w-md rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#009EE3]/10">
          <Wallet className="size-5 text-[#009EE3]" />
        </div>
        <div>
          <p className="font-semibold">Mercado Pago</p>
          {connected ? (
            <Badge className="mt-0.5 bg-primary">Conectado</Badge>
          ) : (
            <Badge variant="secondary" className="mt-0.5">
              Não conectado
            </Badge>
          )}
        </div>
      </div>

      {connected ? (
        <>
          <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-primary" />
              PIX online: ativo
            </p>
            <p className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-primary" />
              Cartão online: ativo
            </p>
            {connectedAt && <p>Conectado em {formatDateTime(connectedAt)}</p>}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="mt-4" disabled={loading}>
                Desconectar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Desconectar Mercado Pago?</AlertDialogTitle>
                <AlertDialogDescription>
                  Sua loja deixará de aceitar PIX e cartão online até que você conecte novamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisconnect}>Desconectar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm text-muted-foreground">
            Conecte sua conta Mercado Pago para receber pagamentos por PIX e cartão diretamente no VSFood.
          </p>
          <Button asChild className="mt-4">
            <a href="/api/mercadopago/oauth/authorize">Conectar Mercado Pago</a>
          </Button>
        </>
      )}
    </div>
  );
}
