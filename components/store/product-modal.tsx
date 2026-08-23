"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { formatCurrencyBRL } from "@/lib/format";
import { useCartStore, type CartSelectedOption } from "@/lib/store/cart";
import type { StorefrontProduct } from "@/lib/data/storefront";

export function ProductModal({
  product,
  open,
  onOpenChange,
}: {
  product: StorefrontProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  const basePrice = product ? (product.promo_price ?? product.price) : 0;

  const selectedOptions: CartSelectedOption[] = useMemo(() => {
    if (!product) return [];
    const result: CartSelectedOption[] = [];
    for (const group of product.optionGroups) {
      const selectedIds = selections[group.id] ?? [];
      for (const optionId of selectedIds) {
        const option = group.options.find((o) => o.id === optionId);
        if (option) {
          result.push({ groupId: group.id, groupName: group.name, optionId: option.id, optionName: option.name, price: option.price });
        }
      }
    }
    return result;
  }, [product, selections]);

  const totalPrice = (basePrice + selectedOptions.reduce((s, o) => s + o.price, 0)) * quantity;

  function reset() {
    setQuantity(1);
    setNotes("");
    setSelections({});
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function toggleSingle(groupId: string, optionId: string) {
    setSelections((prev) => ({ ...prev, [groupId]: [optionId] }));
  }

  function toggleMulti(groupId: string, optionId: string, max: number) {
    setSelections((prev) => {
      const current = prev[groupId] ?? [];
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      }
      if (current.length >= max) {
        toast.warning(`Escolha no máximo ${max} ${max === 1 ? "opção" : "opções"}.`);
        return prev;
      }
      return { ...prev, [groupId]: [...current, optionId] };
    });
  }

  function missingRequiredGroup(): string | null {
    if (!product) return null;
    for (const group of product.optionGroups) {
      if (!group.required) continue;
      const count = (selections[group.id] ?? []).length;
      if (count < Math.max(group.min_select, 1)) return group.name;
    }
    return null;
  }

  function handleAdd() {
    if (!product) return;
    const missing = missingRequiredGroup();
    if (missing) {
      toast.error(`Selecione uma opção em "${missing}".`);
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      imageUrl: product.image_url,
      unitBasePrice: basePrice,
      quantity,
      notes: notes.trim(),
      options: selectedOptions,
    });
    toast.success(`${product.name} adicionado ao carrinho.`);
    handleOpenChange(false);
  }

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[var(--store-border)] bg-[var(--store-card)] sm:max-w-lg">
        <DialogHeader>
          {product.image_url && (
            <div className="relative -mx-6 -mt-6 mb-2 h-44 overflow-hidden bg-[var(--store-category-bg)]">
              <ImageWithFallback src={product.image_url} alt={product.name} fill sizes="600px" className="object-cover" showLabel={false} />
            </div>
          )}
          <DialogTitle className="text-[var(--store-text)]">{product.name}</DialogTitle>
          {product.description && (
            <DialogDescription className="text-[var(--store-text-muted)]">{product.description}</DialogDescription>
          )}
        </DialogHeader>

        <p className="text-xl font-bold text-[var(--store-price)]">{formatCurrencyBRL(basePrice)}</p>

        <div className="space-y-6">
          {product.optionGroups.map((group) => (
            <div key={group.id}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-[var(--store-text)]">{group.name}</p>
                <Badge
                  variant={group.required ? "default" : "secondary"}
                  className={group.required ? "bg-[var(--store-primary)] text-[var(--store-button-text)]" : undefined}
                >
                  {group.required ? "Obrigatório" : "Opcional"} · máx {group.max_select}
                </Badge>
              </div>

              {group.max_select === 1 ? (
                <RadioGroup
                  className="mt-3 space-y-2"
                  value={selections[group.id]?.[0]}
                  onValueChange={(value) => toggleSingle(group.id, value)}
                >
                  {group.options.map((option) => (
                    <Label
                      key={option.id}
                      htmlFor={option.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg border p-3 text-sm font-normal has-[[data-state=checked]]:border-[var(--store-primary)]"
                    >
                      <span className="flex items-center gap-2">
                        <RadioGroupItem value={option.id} id={option.id} />
                        {option.name}
                      </span>
                      {option.price > 0 && (
                        <span className="text-muted-foreground">+ {formatCurrencyBRL(option.price)}</span>
                      )}
                    </Label>
                  ))}
                </RadioGroup>
              ) : (
                <div className="mt-3 space-y-2">
                  {group.options.map((option) => {
                    const checked = (selections[group.id] ?? []).includes(option.id);
                    return (
                      <Label
                        key={option.id}
                        htmlFor={option.id}
                        className="flex cursor-pointer items-center justify-between rounded-lg border p-3 text-sm font-normal has-[[data-state=checked]]:border-[var(--store-primary)]"
                      >
                        <span className="flex items-center gap-2">
                          <Checkbox
                            id={option.id}
                            checked={checked}
                            onCheckedChange={() => toggleMulti(group.id, option.id, group.max_select)}
                          />
                          {option.name}
                        </span>
                        {option.price > 0 && (
                          <span className="text-muted-foreground">+ {formatCurrencyBRL(option.price)}</span>
                        )}
                      </Label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Ex: sem cebola"
              className="mt-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="mt-2 flex-row items-center gap-3 sm:justify-between">
          <div className="flex items-center gap-3 rounded-full border p-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="rounded-full"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Minus className="size-4" />
            </Button>
            <span className="w-4 text-center font-medium">{quantity}</span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="rounded-full"
              onClick={() => setQuantity((q) => q + 1)}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <Button
            className="flex-1"
            size="lg"
            style={{ backgroundColor: "var(--store-button)", color: "var(--store-button-text)" }}
            onClick={handleAdd}
          >
            Adicionar · {formatCurrencyBRL(totalPrice)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
