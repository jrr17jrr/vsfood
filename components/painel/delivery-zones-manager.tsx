"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  createDeliveryZoneAction,
  deleteDeliveryZoneAction,
  updateDeliveryZoneAction,
} from "@/lib/actions/painel/delivery-zones";
import type { DeliveryZone } from "@/types/database";

export function DeliveryZonesManager({ zones }: { zones: DeliveryZone[] }) {
  const router = useRouter();
  const [newNeighborhood, setNewNeighborhood] = useState("");
  const [newFee, setNewFee] = useState("");

  async function handleAdd() {
    if (!newNeighborhood.trim() || !newFee) return;
    const result = await createDeliveryZoneAction({
      neighborhood: newNeighborhood.trim(),
      fee: Number(newFee.replace(",", ".")) || 0,
      active: true,
    });
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setNewNeighborhood("");
    setNewFee("");
    router.refresh();
  }

  async function handleUpdate(zone: DeliveryZone, patch: Partial<DeliveryZone>) {
    const result = await updateDeliveryZoneAction(zone.id, {
      neighborhood: patch.neighborhood ?? zone.neighborhood,
      fee: patch.fee ?? zone.fee,
      active: patch.active ?? zone.active,
    });
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await deleteDeliveryZoneAction(id);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {zones.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-muted-foreground">
          <Truck className="size-8" />
          <p className="font-medium text-foreground">Nenhuma região cadastrada</p>
          <p className="text-sm">Sem regiões cadastradas, a entrega é gratuita para qualquer bairro.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {zones.map((zone) => (
            <ZoneRow key={zone.id} zone={zone} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Input placeholder="Bairro" value={newNeighborhood} onChange={(e) => setNewNeighborhood(e.target.value)} className="max-w-56" />
        <Input placeholder="Taxa (R$)" value={newFee} onChange={(e) => setNewFee(e.target.value)} className="w-32" />
        <Button type="button" variant="outline" onClick={handleAdd}>
          <Plus className="size-4" />
          Adicionar região
        </Button>
      </div>
    </div>
  );
}

function ZoneRow({
  zone,
  onUpdate,
  onDelete,
}: {
  zone: DeliveryZone;
  onUpdate: (zone: DeliveryZone, patch: Partial<DeliveryZone>) => void;
  onDelete: (id: string) => void;
}) {
  const [neighborhood, setNeighborhood] = useState(zone.neighborhood);
  const [fee, setFee] = useState(String(zone.fee));

  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card p-3">
      <Input
        value={neighborhood}
        onChange={(e) => setNeighborhood(e.target.value)}
        onBlur={() => onUpdate(zone, { neighborhood })}
        className="max-w-56"
      />
      <Input
        value={fee}
        onChange={(e) => setFee(e.target.value)}
        onBlur={() => onUpdate(zone, { fee: Number(fee.replace(",", ".")) || 0 })}
        className="w-28"
      />
      <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
        Ativa
        <Switch checked={zone.active} onCheckedChange={(v) => onUpdate(zone, { active: v })} />
      </label>
      <Button type="button" size="icon" variant="ghost" onClick={() => onDelete(zone.id)}>
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
