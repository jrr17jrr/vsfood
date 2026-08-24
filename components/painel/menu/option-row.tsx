"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { updateOptionAction, deleteOptionAction } from "@/lib/actions/painel/menu";
import type { MenuOptionGroup } from "@/lib/data/menu";
import type { OptionGroupPricingMode } from "@/types/database";
import { cn } from "@/lib/utils";

const PRICE_MATTERS: Record<OptionGroupPricingMode, boolean> = {
  no_charge: false,
  per_option: true,
  free_first_n: true,
  highest_only: true,
  fixed_price: false,
};

/** Uma linha "Coca-Cola · R$ 5,00 · [ativo] [excluir]" — mesma lógica de sempre, só o visual mudou. */
export function OptionRow({
  option,
  pricingMode,
  onChange,
}: {
  option: MenuOptionGroup["options"][number];
  pricingMode: OptionGroupPricingMode;
  onChange: () => void;
}) {
  const [name, setName] = useState(option.name);
  const [price, setPrice] = useState(String(option.price));
  const [available, setAvailable] = useState(option.available);
  const priceMatters = PRICE_MATTERS[pricingMode];

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
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-sm">
      <Input
        className="h-8 min-w-0 flex-1 border-none bg-transparent px-1 shadow-none focus-visible:ring-1"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => save()}
      />
      <Input
        className={cn("h-8 w-20 shrink-0", !priceMatters && "border-dashed text-muted-foreground/70")}
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        onBlur={() => save()}
        placeholder="0,00"
        title={priceMatters ? undefined : "Preço individual não é usado neste tipo de cobrança"}
      />
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <Switch
          checked={available}
          onCheckedChange={(v) => {
            setAvailable(v);
            save({ available: v });
          }}
          aria-label="Opção ativa"
        />
        <Button type="button" size="icon" variant="ghost" className="size-7" onClick={handleDelete} aria-label="Excluir opção">
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
