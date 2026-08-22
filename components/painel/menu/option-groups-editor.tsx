"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  createOptionAction,
  createOptionGroupAction,
  deleteOptionAction,
  deleteOptionGroupAction,
  updateOptionAction,
  updateOptionGroupAction,
} from "@/lib/actions/painel/menu";
import type { MenuOptionGroup } from "@/lib/data/menu";

export function OptionGroupsEditor({ productId, groups }: { productId: string; groups: MenuOptionGroup[] }) {
  const router = useRouter();
  const [newGroupName, setNewGroupName] = useState("");

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    const result = await createOptionGroupAction(productId, {
      name: newGroupName.trim(),
      required: false,
      minSelect: 0,
      maxSelect: 1,
    });
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setNewGroupName("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Grupos de adicionais</p>
      </div>

      {groups.map((group) => (
        <GroupCard key={group.id} group={group} onChange={() => router.refresh()} />
      ))}

      <div className="flex gap-2">
        <Input placeholder="Novo grupo (ex: Ponto da carne)" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
        <Button type="button" variant="outline" onClick={handleCreateGroup}>
          <Plus className="size-4" />
          Adicionar grupo
        </Button>
      </div>
    </div>
  );
}

function GroupCard({ group, onChange }: { group: MenuOptionGroup; onChange: () => void }) {
  const [name, setName] = useState(group.name);
  const [required, setRequired] = useState(group.required);
  const [minSelect, setMinSelect] = useState(group.min_select);
  const [maxSelect, setMaxSelect] = useState(group.max_select);
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState("0");

  async function saveGroup() {
    const result = await updateOptionGroupAction(group.id, {
      name,
      required,
      minSelect,
      maxSelect,
    });
    if (result?.error) toast.error(result.error);
    else onChange();
  }

  async function handleDeleteGroup() {
    const result = await deleteOptionGroupAction(group.id);
    if (result?.error) toast.error(result.error);
    else onChange();
  }

  async function handleAddOption() {
    if (!newOptionName.trim()) return;
    const result = await createOptionAction(group.id, {
      name: newOptionName.trim(),
      price: Number(newOptionPrice.replace(",", ".")) || 0,
      available: true,
    });
    if (result?.error) toast.error(result.error);
    else {
      setNewOptionName("");
      setNewOptionPrice("0");
      onChange();
    }
  }

  return (
    <div className="rounded-xl border p-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Input className="col-span-2 sm:col-span-1" value={name} onChange={(e) => setName(e.target.value)} onBlur={saveGroup} />
        <div className="flex items-center gap-2">
          <Label className="text-xs">Mín</Label>
          <Input
            type="number"
            min={0}
            className="w-16"
            value={minSelect}
            onChange={(e) => setMinSelect(Number(e.target.value))}
            onBlur={saveGroup}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Máx</Label>
          <Input
            type="number"
            min={1}
            className="w-16"
            value={maxSelect}
            onChange={(e) => setMaxSelect(Number(e.target.value))}
            onBlur={saveGroup}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Obrigatório</Label>
          <Switch
            checked={required}
            onCheckedChange={(v) => {
              setRequired(v);
              updateOptionGroupAction(group.id, { name, required: v, minSelect, maxSelect }).then((r) => {
                if (r?.error) toast.error(r.error);
                else onChange();
              });
            }}
          />
        </div>
      </div>

      <Separator className="my-3" />

      <div className="space-y-2">
        {group.options.map((option) => (
          <OptionRow key={option.id} option={option} onChange={onChange} />
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <Input placeholder="Nome do adicional" value={newOptionName} onChange={(e) => setNewOptionName(e.target.value)} />
        <Input
          placeholder="Preço"
          className="w-24"
          value={newOptionPrice}
          onChange={(e) => setNewOptionPrice(e.target.value)}
        />
        <Button type="button" size="sm" variant="outline" onClick={handleAddOption}>
          <Plus className="size-4" />
        </Button>
      </div>

      <Button type="button" size="sm" variant="ghost" className="mt-2 text-destructive" onClick={handleDeleteGroup}>
        <Trash2 className="size-3.5" />
        Excluir grupo
      </Button>
    </div>
  );
}

function OptionRow({ option, onChange }: { option: MenuOptionGroup["options"][number]; onChange: () => void }) {
  const [name, setName] = useState(option.name);
  const [price, setPrice] = useState(String(option.price));
  const [available, setAvailable] = useState(option.available);

  async function save(patch?: Partial<{ available: boolean }>) {
    const result = await updateOptionAction(option.id, {
      name,
      price: Number(price.replace(",", ".")) || 0,
      available: patch?.available ?? available,
    });
    if (result?.error) toast.error(result.error);
    else onChange();
  }

  async function handleDelete() {
    const result = await deleteOptionAction(option.id);
    if (result?.error) toast.error(result.error);
    else onChange();
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Input className="flex-1" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => save()} />
      <Input className="w-20" value={price} onChange={(e) => setPrice(e.target.value)} onBlur={() => save()} />
      <Switch
        checked={available}
        onCheckedChange={(v) => {
          setAvailable(v);
          save({ available: v });
        }}
      />
      <Button type="button" size="icon" variant="ghost" onClick={handleDelete}>
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
