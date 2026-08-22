"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { onlyDigits } from "@/lib/format";
import { updateWhatsappAction } from "@/lib/actions/profile";

const schema = z.object({
  whatsapp: z.string().trim().refine((v) => onlyDigits(v).length >= 10 && onlyDigits(v).length <= 11, "WhatsApp inválido"),
});
type FormValues = z.infer<typeof schema>;

export function WhatsappGate({ open, onSaved }: { open: boolean; onSaved: (whatsapp: string) => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setLoading(true);
    const result = await updateWhatsappAction(values.whatsapp);
    setLoading(false);
    if (result?.error) {
      setServerError(result.error);
      return;
    }
    onSaved(onlyDigits(values.whatsapp));
  }

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false} onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Antes de continuar, informe seu WhatsApp</DialogTitle>
          <DialogDescription>Usamos seu WhatsApp para o restaurante entrar em contato sobre o pedido.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="gate-whatsapp">WhatsApp</Label>
            <Input id="gate-whatsapp" placeholder="(11) 99999-9999" autoFocus {...register("whatsapp")} />
            {errors.whatsapp && <p className="text-xs text-destructive">{errors.whatsapp.message}</p>}
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Continuar pedido"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
