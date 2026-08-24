"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createOptionAction,
  deleteOptionGroupAction,
  reorderOptionGroupAction,
  updateOptionGroupAction,
} from "@/lib/actions/painel/menu";
import type { OptionGroupInput } from "@/lib/validations/menu";
import type { MenuOptionGroup } from "@/lib/data/menu";
import type { OptionGroupPricingMode } from "@/types/database";
import { OptionRow } from "./option-row";

/** Nome padrão de grupo recém-criado — usado tanto pra criar quanto pra detectar "ainda não configurado" e abrir o accordion sozinho. */
export const NEW_GROUP_NAME = "Novo grupo de adicionais";

const PRICING_MODE_LABEL: Record<OptionGroupPricingMode, string> = {
  no_charge: "Sem custo adicional",
  per_option: "Cobrar valor de cada opção",
  free_first_n: "Primeiras X opções grátis",
  highest_only: "Cobrar apenas a opção mais cara",
  fixed_price: "Cobrar valor fixo do grupo",
};

const PRICING_BADGE_LABEL: Record<OptionGroupPricingMode, (freeQuantity: number) => string> = {
  no_charge: () => "Sem custo",
  per_option: () => "Por opção",
  free_first_n: (n) => `${n} grátis`,
  highest_only: () => "Mais cara",
  fixed_price: () => "Valor fixo",
};

/** "1 escolha" / "Até 2" / "2 escolhas" / "1 a 3" — rótulo compacto pro badge do card fechado. */
function selectionCountLabel(min: number, max: number): string {
  if (max === 1) return "1 escolha";
  if (min <= 0) return `Até ${max}`;
  if (min === max) return `${min} escolhas`;
  return `${min} a ${max}`;
}

export function OptionGroupCard({ group, onChange }: { group: MenuOptionGroup; onChange: () => void }) {
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

  // Grupo recém-criado (nome padrão + zero opções) abre automaticamente pro
  // dono já cair configurando, sem precisar rastrear "o que acabou de ser
  // criado" com estado/efeitos extra.
  const looksUnfinished = group.name === NEW_GROUP_NAME && group.options.length === 0;

  return (
    <div className="min-w-0 rounded-xl border bg-card">
      <Accordion type="single" collapsible defaultValue={looksUnfinished ? "details" : undefined}>
        <AccordionItem value="details" className="border-b-0">
          <div className="flex items-center gap-1 px-2 sm:px-3">
            <div className="flex shrink-0 flex-col rounded-md border bg-muted/40 text-muted-foreground">
              <button
                type="button"
                onClick={() => handleReorder("up")}
                className="px-1 pt-0.5 hover:text-foreground"
                aria-label="Mover grupo para cima"
              >
                <ChevronUp className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleReorder("down")}
                className="px-1 pb-0.5 hover:text-foreground"
                aria-label="Mover grupo para baixo"
              >
                <ChevronDown className="size-3.5" />
              </button>
            </div>

            <AccordionTrigger className="min-w-0 flex-1 py-2.5 hover:no-underline">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1.5 pr-2">
                <span className="min-w-0 truncate font-medium text-foreground">{group.name}</span>
                <div className="flex flex-wrap items-center gap-1">
                  <Badge variant={group.required ? "destructive" : "secondary"}>{group.required ? "Obrigatório" : "Opcional"}</Badge>
                  <Badge variant="outline">{selectionCountLabel(group.min_select, group.max_select)}</Badge>
                  <Badge variant="outline">{PRICING_BADGE_LABEL[group.pricing_mode](group.free_quantity)}</Badge>
                </div>
              </div>
            </AccordionTrigger>
          </div>

          <AccordionContent className="space-y-5 px-3 pb-4 sm:px-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do grupo</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => saveGroup()} />
            </div>

            <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Regras de seleção</p>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-normal">Obrigatório</Label>
                <Switch checked={required} onCheckedChange={handleRequiredChange} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Mínimo</Label>
                  <Input
                    type="number"
                    min={0}
                    value={minSelect}
                    onChange={(e) => setMinSelect(Number(e.target.value))}
                    onBlur={() => saveGroup()}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Máximo</Label>
                  <Input
                    type="number"
                    min={1}
                    value={maxSelect}
                    onChange={(e) => setMaxSelect(Number(e.target.value))}
                    onBlur={() => saveGroup()}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Cobrança</p>
              <div className="space-y-1">
                <Label className="text-xs">Tipo de cobrança</Label>
                <Select value={pricingMode} onValueChange={(v) => handlePricingModeChange(v as OptionGroupPricingMode)}>
                  <SelectTrigger className="w-full text-xs">
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
                    value={freeQuantity}
                    onChange={(e) => setFreeQuantity(Number(e.target.value))}
                    onBlur={() => saveGroup()}
                  />
                </div>
              )}

              {pricingMode === "fixed_price" && (
                <div className="space-y-1">
                  <Label className="text-xs">Valor fixo (R$)</Label>
                  <Input value={fixedPrice} onChange={(e) => setFixedPrice(e.target.value)} onBlur={() => saveGroup()} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Opções do grupo</p>

              <div className="space-y-1.5">
                {group.options.map((option) => (
                  <OptionRow key={option.id} option={option} pricingMode={pricingMode} onChange={onChange} />
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Input
                  placeholder="Nome da opção"
                  className="min-w-0 flex-1"
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                />
                <Input
                  placeholder="Preço"
                  className="w-20 shrink-0"
                  value={newOptionPrice}
                  onChange={(e) => setNewOptionPrice(e.target.value)}
                />
                <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={handleAddOption}>
                  <Plus className="size-4" />
                  Adicionar
                </Button>
              </div>
            </div>

            <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDeleteGroup}>
              <Trash2 className="size-3.5" />
              Excluir grupo
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
