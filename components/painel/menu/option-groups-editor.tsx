"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createOptionAction,
  createOptionGroupAction,
  deleteOptionAction,
  deleteOptionGroupAction,
  reorderOptionGroupAction,
  updateOptionAction,
  updateOptionGroupAction,
} from "@/lib/actions/painel/menu";
import type { OptionGroupInput } from "@/lib/validations/menu";
import type { MenuOptionGroup } from "@/lib/data/menu";
import type { OptionGroupPricingMode } from "@/types/database";

const PRICING_MODE_LABEL: Record<OptionGroupPricingMode, string> = {
  no_charge: "Sem custo adicional",
  per_option: "Cobrar valor de cada opção",
  free_first_n: "Primeiras X opções grátis",
  highest_only: "Cobrar apenas a opção mais cara",
  fixed_price: "Cobrar valor fixo do grupo",
};

const DEFAULT_GROUP_INPUT: OptionGroupInput = {
  name: "",
  required: false,
  minSelect: 0,
  maxSelect: 1,
  pricingMode: "per_option",
  freeQuantity: 0,
  fixedPrice: 0,
};

export function OptionGroupsEditor({ productId, groups }: { productId: string; groups: MenuOptionGroup[] }) {
  const router = useRouter();
  const [newGroupName, setNewGroupName] = useState("");

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    const result = await createOptionGroupAction(productId, { ...DEFAULT_GROUP_INPUT, name: newGroupName.trim() });
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
  const [pricingMode, setPricingMode] = useState<OptionGroupPricingMode>(group.pricing_mode);
  const [freeQuantity, setFreeQuantity] = useState(group.free_quantity);
  const [fixedPrice, setFixedPrice] = useState(String(group.fixed_price));
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState("0");

  async function saveGroup(overrides?: Partial<OptionGroupInput>) {
    const input: OptionGroupInput = {
      name,
      required,
      minSelect,
      maxSelect,
      pricingMode,
      freeQuantity,
      fixedPrice: Number(fixedPrice.replace(",", ".")) || 0,
      ...overrides,
    };
    const result = await updateOptionGroupAction(group.id, input);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    onChange();
  }

  function handleRequiredChange(v: boolean) {
    setRequired(v);
    // Grupo obrigatório precisa de mínimo >= 1 — ajusta na hora pra não
    // depender do dono perceber o erro de validação depois.
    const nextMin = v && minSelect < 1 ? 1 : minSelect;
    if (nextMin !== minSelect) setMinSelect(nextMin);
    saveGroup({ required: v, minSelect: nextMin });
  }

  function handlePricingModeChange(mode: OptionGroupPricingMode) {
    setPricingMode(mode);
    saveGroup({ pricingMode: mode });
  }

  async function handleReorder(direction: "up" | "down") {
    await reorderOptionGroupAction(group.id, direction);
    onChange();
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
      <div className="flex items-start gap-2">
        <div className="flex shrink-0 flex-col pt-2">
          <button type="button" onClick={() => handleReorder("up")} className="text-muted-foreground hover:text-foreground">
            <ChevronUp className="size-3.5" />
          </button>
          <button type="button" onClick={() => handleReorder("down")} className="text-muted-foreground hover:text-foreground">
            <ChevronDown className="size-3.5" />
          </button>
        </div>

        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Input
              className="col-span-2 sm:col-span-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => saveGroup()}
            />
            <div className="flex items-center gap-2">
              <Label className="text-xs">Mín</Label>
              <Input
                type="number"
                min={0}
                className="w-16"
                value={minSelect}
                onChange={(e) => setMinSelect(Number(e.target.value))}
                onBlur={() => saveGroup()}
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
                onBlur={() => saveGroup()}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Obrigatório</Label>
              <Switch checked={required} onCheckedChange={handleRequiredChange} />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Tipo de cobrança</Label>
              <Select value={pricingMode} onValueChange={(v) => handlePricingModeChange(v as OptionGroupPricingMode)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRICING_MODE_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {pricingMode === "free_first_n" && (
              <div className="space-y-1">
                <Label className="text-xs">Quantidade grátis</Label>
                <Input
                  type="number"
                  min={0}
                  max={maxSelect}
                  className="h-8"
                  value={freeQuantity}
                  onChange={(e) => setFreeQuantity(Number(e.target.value))}
                  onBlur={() => saveGroup()}
                />
              </div>
            )}

            {pricingMode === "fixed_price" && (
              <div className="space-y-1">
                <Label className="text-xs">Valor fixo (R$)</Label>
                <Input
                  className="h-8"
                  value={fixedPrice}
                  onChange={(e) => setFixedPrice(e.target.value)}
                  onBlur={() => saveGroup()}
                />
              </div>
            )}
          </div>
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
