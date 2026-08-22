"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
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
import { AddressForm } from "./address-form";
import { createAddressAction, deleteAddressAction, updateAddressAction } from "@/lib/actions/addresses";
import type { CustomerAddress } from "@/types/database";
import type { AddressInput } from "@/lib/validations/checkout";

export function AddressList({ addresses }: { addresses: CustomerAddress[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerAddress | null>(null);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(address: CustomerAddress) {
    setEditing(address);
    setOpen(true);
  }

  async function handleSubmit(values: AddressInput & { isDefault: boolean }) {
    const result = editing ? await updateAddressAction(editing.id, values) : await createAddressAction(values);
    if (!result?.error) {
      setOpen(false);
      toast.success("Endereço salvo.");
      router.refresh();
    }
    return result;
  }

  async function handleDelete(id: string) {
    const result = await deleteAddressAction(id);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Endereço removido.");
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Meus endereços</h2>
          <p className="mt-1 text-sm text-muted-foreground">Endereços salvos para entrega.</p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" />
          Novo endereço
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-muted-foreground">
          <MapPin className="size-8" />
          <p className="font-medium text-foreground">Nenhum endereço cadastrado</p>
          <p className="text-sm">Seu primeiro endereço será salvo no seu próximo pedido.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {addresses.map((address) => (
            <div key={address.id} className="flex items-start justify-between gap-3 rounded-2xl border bg-card p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{address.label || "Endereço"}</p>
                  {address.is_default && <Badge variant="secondary">Padrão</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {address.street}, {address.number}
                  {address.complement ? ` - ${address.complement}` : ""} · {address.neighborhood}, {address.city}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(address)}>
                  <Pencil className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover endereço?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(address.id)}>Remover</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar endereço" : "Novo endereço"}</DialogTitle>
          </DialogHeader>
          <AddressForm address={editing ?? undefined} onSubmit={handleSubmit} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
