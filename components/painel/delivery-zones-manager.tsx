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
  reorderDeliveryZonesAction,
  updateDeliveryZoneAction,
} from "@/lib/actions/painel/delivery-zones";
import { SortableList } from "@/components/painel/menu/sortable-list";
import { SortableItem } from "@/components/painel/menu/sortable-item";
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
      minOrderValue: null,
      estimatedTimeMinutes: null,
    });
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setNewNeighborhood("");
    setNewFee("");
    router.refresh();
  }

  async function handleUpdate(
    zone: DeliveryZone,
    patch: Partial<{ neighborhood: string; fee: number; active: boolean; min_order_value: number | null; estimated_time_minutes: number | null }>,
  ) {
    const result = await updateDeliveryZoneAction(zone.id, {
      neighborhood: patch.neighborhood ?? zone.neighborhood,
      fee: patch.fee ?? zone.fee,
      active: patch.active ?? zone.active,
      minOrderValue: "min_order_value" in patch ? patch.min_order_value! : zone.min_order_value,
      estimatedTimeMinutes: "estimated_time_minutes" in patch ? patch.estimated_time_minutes! : zone.estimated_time_minutes,
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

  async function handleReorder(orderedIds: string[]) {
    await reorderDeliveryZonesAction(orderedIds);
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
        <SortableList items={zones} onReorder={handleReorder} className="space-y-2">
          {(zone) => (
            <SortableItem key={zone.id} id={zone.id}>
              <ZoneRow zone={zone} onUpdate={handleUpdate} onDelete={handleDelete} />
            </SortableItem>
          )}
        </SortableList>
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
  onUpdate: (
    zone: DeliveryZone,
    patch: Partial<{ neighborhood: string; fee: number; active: boolean; min_order_value: number | null; estimated_time_minutes: number | null }>,
  ) => void;
  onDelete: (id: string) => void;
}) {
  const [neighborhood, setNeighborhood] = useState(zone.neighborhood);
  const [fee, setFee] = useState(String(zone.fee));
  const [minOrder, setMinOrder] = useState(zone.min_order_value != null ? String(zone.min_order_value) : "");
  const [estimatedTime, setEstimatedTime] = useState(zone.estimated_time_minutes != null ? String(zone.estimated_time_minutes) : "");

  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
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
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Input
          placeholder="Pedido mínimo (opcional)"
          value={minOrder}
          onChange={(e) => setMinOrder(e.target.value)}
          onBlur={() => onUpdate(zone, { min_order_value: minOrder.trim() ? Number(minOrder.replace(",", ".")) || 0 : null })}
          className="text-xs"
        />
        <Input
          placeholder="Tempo estimado, min (opcional)"
          value={estimatedTime}
          onChange={(e) => setEstimatedTime(e.target.value)}
          onBlur={() => onUpdate(zone, { estimated_time_minutes: estimatedTime.trim() ? Math.trunc(Number(estimatedTime)) || 0 : null })}
          className="text-xs"
        />
      </div>
    </div>
  );
}
