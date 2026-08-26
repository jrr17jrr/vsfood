"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Pencil, Plus, Ticket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { CouponForm } from "./coupon-form";
import {
  createCouponAction,
  deleteCouponAction,
  getCouponWithLinksAction,
  updateCouponAction,
  type CouponWithLinks,
} from "@/lib/actions/painel/coupons";
import { formatCurrencyBRL } from "@/lib/format";
import type { Coupon } from "@/types/database";
import type { CouponInput } from "@/lib/validations/coupon";
import type { MenuCategory } from "@/lib/data/menu";

function couponSummary(coupon: Coupon): string {
  const discount =
    coupon.type === "percent"
      ? `${coupon.value}% off`
      : coupon.type === "fixed"
        ? `${formatCurrencyBRL(coupon.value)} off`
        : "Frete grátis";
  const parts = [discount, `pedido mín. ${formatCurrencyBRL(coupon.min_order_value)}`];
  if (coupon.usage_limit) parts.push(`${coupon.used_count}/${coupon.usage_limit} usos`);
  return parts.join(" · ");
}

export function CouponsManager({ coupons, menu }: { coupons: Coupon[]; menu: MenuCategory[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [duplicateFrom, setDuplicateFrom] = useState<CouponWithLinks | undefined>(undefined);

  async function handleSubmit(values: CouponInput) {
    const result = editing ? await updateCouponAction(editing.id, values) : await createCouponAction(values);
    if (!result?.error) {
      setOpen(false);
      toast.success("Cupom salvo.");
      router.refresh();
    }
    return result;
  }

  async function handleDelete(id: string) {
    const result = await deleteCouponAction(id);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Cupom removido.");
    router.refresh();
  }

  async function handleDuplicate(coupon: Coupon) {
    const withLinks = await getCouponWithLinksAction(coupon.id);
    if (!withLinks) {
      toast.error("Não foi possível duplicar o cupom.");
      return;
    }
    setEditing(null);
    setDuplicateFrom(withLinks);
    setOpen(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Crie códigos de desconto para seus clientes.</p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setDuplicateFrom(undefined);
            setOpen(true);
          }}
        >
          <Plus className="size-4" />
          Criar cupom
        </Button>
      </div>

      {coupons.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
          <Ticket className="size-8" />
          <p className="font-medium text-foreground">Nenhum cupom criado</p>
          <p className="text-sm">Crie cupons de desconto para atrair mais pedidos.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-semibold">{coupon.code}</p>
                  <Badge variant={coupon.active ? "default" : "secondary"}>{coupon.active ? "Ativo" : "Inativo"}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{couponSummary(coupon)}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="icon" variant="ghost" title="Duplicar" onClick={() => handleDuplicate(coupon)}>
                  <Copy className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  title="Editar"
                  onClick={() => {
                    setEditing(coupon);
                    setDuplicateFrom(undefined);
                    setOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" title="Excluir">
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir cupom?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(coupon.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cupom" : duplicateFrom ? "Duplicar cupom" : "Criar cupom"}</DialogTitle>
          </DialogHeader>
          <CouponForm coupon={editing ?? undefined} duplicateFrom={duplicateFrom} menu={menu} onSubmit={handleSubmit} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
