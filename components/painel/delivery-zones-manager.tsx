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
  type DeliveryZoneInput,
} from "@/lib/actions/painel/delivery-zones";
import { SortableList } from "@/components/painel/menu/sortable-list";
import { SortableItem } from "@/components/painel/menu/sortable-item";
import type { DeliveryZone } from "@/types/database";

type ZonePatch = Partial<{
  state: string;
  city: string;
  neighborhood: string;
  fee: number;
  active: boolean;
  min_order_value: number | null;
  estimated_time_minutes: number | null;
}>;

function toInput(zone: ZonePatch & { state: string; city: string; neighborhood: string; fee: number; active: boolean }): DeliveryZoneInput {
  return {
    state: zone.state,
    city: zone.city,
    neighborhood: zone.neighborhood,
    fee: zone.fee,
    active: zone.active,
    minOrderValue: zone.min_order_value ?? null,
    estimatedTimeMinutes: zone.estimated_time_minutes ?? null,
  };
}

export function DeliveryZonesManager({ zones }: { zones: DeliveryZone[] }) {
  const router = useRouter();
  const [newState, setNewState] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newNeighborhood, setNewNeighborhood] = useState("");
  const [newFee, setNewFee] = useState("");

  async function handleAdd() {
    if (!newState.trim() || !newCity.trim() || !newNeighborhood.trim() || !newFee) return;
    const result = await createDeliveryZoneAction({
      state: newState.trim(),
      city: newCity.trim(),
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
    setNewState("");
    setNewCity("");
    setNewNeighborhood("");
    setNewFee("");
    router.refresh();
  }

  async function handleUpdate(zone: DeliveryZone, patch: ZonePatch) {
    const result = await updateDeliveryZoneAction(
      zone.id,
      toInput({
        state: patch.state ?? zone.state ?? "",
        city: patch.city ?? zone.city ?? "",
        neighborhood: patch.neighborhood ?? zone.neighborhood,
        fee: patch.fee ?? zone.fee,
        active: patch.active ?? zone.active,
        min_order_value: "min_order_value" in patch ? patch.min_order_value! : zone.min_order_value,
        estimated_time_minutes: "estimated_time_minutes" in patch ? patch.estimated_time_minutes! : zone.estimated_time_minutes,
      }),
    );
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
        <Input placeholder="UF" value={newState} onChange={(e) => setNewState(e.target.value)} maxLength={2} className="w-16" />
        <Input placeholder="Cidade" value={newCity} onChange={(e) => setNewCity(e.target.value)} className="max-w-40" />
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
  onUpdate: (zone: DeliveryZone, patch: ZonePatch) => void;
  onDelete: (id: string) => void;
}) {
  const [state, setState] = useState(zone.state ?? "");
  const [city, setCity] = useState(zone.city ?? "");
  const [neighborhood, setNeighborhood] = useState(zone.neighborhood);
  const [fee, setFee] = useState(String(zone.fee));
  const [minOrder, setMinOrder] = useState(zone.min_order_value != null ? String(zone.min_order_value) : "");
  const [estimatedTime, setEstimatedTime] = useState(zone.estimated_time_minutes != null ? String(zone.estimated_time_minutes) : "");

  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={state}
          onChange={(e) => setState(e.target.value)}
          onBlur={() => onUpdate(zone, { state })}
          placeholder="UF"
          maxLength={2}
          className="w-16"
        />
        <Input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onBlur={() => onUpdate(zone, { city })}
          placeholder="Cidade"
          className="max-w-40"
        />
        <Input
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
          onBlur={() => onUpdate(zone, { neighborhood })}
          placeholder="Bairro"
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
      {!zone.state && !zone.city && (
        <p className="mt-1 text-xs text-muted-foreground">
          Região antiga (sem UF/cidade) — combina só pelo bairro. Preencha UF e cidade e salve pra deixar mais preciso.
        </p>
      )}
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
