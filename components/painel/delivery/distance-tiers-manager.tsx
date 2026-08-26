"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createDistanceTierAction,
  deleteDistanceTierAction,
  updateDistanceTierAction,
} from "@/lib/actions/painel/delivery-zones";
import type { DeliveryDistanceTier } from "@/types/database";

export function DistanceTiersManager({ tiers }: { tiers: DeliveryDistanceTier[] }) {
  const router = useRouter();
  const [newMaxDistance, setNewMaxDistance] = useState("");
  const [newFee, setNewFee] = useState("");

  async function handleAdd() {
    if (!newMaxDistance || !newFee) return;
    const result = await createDistanceTierAction({
      maxDistanceKm: Number(newMaxDistance.replace(",", ".")) || 0,
      fee: Number(newFee.replace(",", ".")) || 0,
    });
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setNewMaxDistance("");
    setNewFee("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await deleteDistanceTierAction(id);
    if (result?.error) toast.error(result.error);
    router.refresh();
  }

  const sorted = [...tiers].sort((a, b) => a.max_distance_km - b.max_distance_km);

  return (
    <div className="space-y-2">
      {sorted.map((tier) => (
        <TierRow key={tier.id} tier={tier} onDelete={handleDelete} />
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Até</span>
        <Input
          placeholder="km"
          value={newMaxDistance}
          onChange={(e) => setNewMaxDistance(e.target.value)}
          className="w-20"
        />
        <span className="text-sm text-muted-foreground">— R$</span>
        <Input placeholder="0,00" value={newFee} onChange={(e) => setNewFee(e.target.value)} className="w-24" />
        <Button type="button" size="sm" variant="outline" onClick={handleAdd}>
          <Plus className="size-4" />
          Adicionar faixa
        </Button>
      </div>
    </div>
  );
}

function TierRow({ tier, onDelete }: { tier: DeliveryDistanceTier; onDelete: (id: string) => void }) {
  const router = useRouter();
  const [maxDistance, setMaxDistance] = useState(String(tier.max_distance_km));
  const [fee, setFee] = useState(String(tier.fee));

  async function handleBlur() {
    const result = await updateDistanceTierAction(tier.id, {
      maxDistanceKm: Number(maxDistance.replace(",", ".")) || 0,
      fee: Number(fee.replace(",", ".")) || 0,
    });
    if (result?.error) toast.error(result.error);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card p-2.5 text-sm">
      <span className="text-muted-foreground">Até</span>
      <Input value={maxDistance} onChange={(e) => setMaxDistance(e.target.value)} onBlur={handleBlur} className="w-20" />
      <span className="text-muted-foreground">km — R$</span>
      <Input value={fee} onChange={(e) => setFee(e.target.value)} onBlur={handleBlur} className="w-24" />
      <Button type="button" size="icon" variant="ghost" className="ml-auto" onClick={() => onDelete(tier.id)}>
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
