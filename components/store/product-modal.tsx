"use client";

import type { CSSProperties } from "react";
import { useMemo, useRef, useState } from "react";
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
import { calculateGroupCharges, describePricingRule, describeSelectionRule } from "@/lib/pricing/option-groups";
import { useCartStore, type CartSelectedOption } from "@/lib/store/cart";
import type { StorefrontOption, StorefrontOptionGroup, StorefrontProduct } from "@/lib/data/storefront";
import { cn } from "@/lib/utils";

/**
 * Rótulo de preço de uma opção na lista: mostra o valor só quando ele
 * realmente muda o total. Em grupos sem custo ou de valor fixo, o preço não
 * é por opção, então não mostra nada aqui (fixed_price tem sua própria nota
 * no cabeçalho do grupo). Quando a opção está selecionada mas a cobrança
 * efetiva é zero (dentro da cota grátis, ou não é a mais cara do grupo),
 * mostra "Grátis" em vez do preço de tabela.
 */
function optionPriceLabel(group: StorefrontOptionGroup, option: StorefrontOption, selected: boolean, charge: number): string | null {
  if (group.pricing_mode === "no_charge" || group.pricing_mode === "fixed_price") return null;
  const display = selected ? charge : option.price;
  if (display > 0) return `+ ${formatCurrencyBRL(display)}`;
  if (selected && option.price > 0) return "Grátis";
  return null;
}

export function ProductModal({
  product,
  open,
  onOpenChange,
  themeStyle,
}: {
  product: StorefrontProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  themeStyle: CSSProperties;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const basePrice = product ? (product.promo_price ?? product.price) : 0;
  const soldOut = product ? !product.unlimited_stock && product.stock_quantity <= 0 : false;

  // Cobrança efetiva de cada opção selecionada, por grupo — única fonte de
  // verdade tanto pro total exibido quanto pro que é enviado ao carrinho.
  const chargesByGroup = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    if (!product) return map;
    for (const group of product.optionGroups) {
      const selectedIds = selections[group.id] ?? [];
      const selectedOpts = selectedIds
        .map((id) => group.options.find((o) => o.id === id))
        .filter((o): o is StorefrontOption => !!o)
        .map((o) => ({ id: o.id, price: o.price }));
      const charges = calculateGroupCharges(
        { id: group.id, pricingMode: group.pricing_mode, freeQuantity: group.free_quantity, fixedPrice: group.fixed_price },
        selectedOpts,
      );
      map.set(
        group.id,
        new Map(charges.map((c) => [c.optionId, c.charge])),
      );
    }
    return map;
  }, [product, selections]);

  const selectedOptions: CartSelectedOption[] = useMemo(() => {
    if (!product) return [];
    const result: CartSelectedOption[] = [];
    for (const group of product.optionGroups) {
      const selectedIds = selections[group.id] ?? [];
      const charges = chargesByGroup.get(group.id);
      for (const optionId of selectedIds) {
        const option = group.options.find((o) => o.id === optionId);
        if (!option) continue;
        result.push({
          groupId: group.id,
          groupName: group.name,
          optionId: option.id,
          optionName: option.name,
          price: charges?.get(optionId) ?? 0,
        });
      }
    }
    return result;
  }, [product, selections, chargesByGroup]);

  const totalPrice = (basePrice + selectedOptions.reduce((s, o) => s + o.price, 0)) * quantity;

  function reset() {
    setQuantity(1);
    setNotes("");
    setSelections({});
    setAttemptedSubmit(false);
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

  function handleAdd() {
    if (!product || soldOut) return;
    setAttemptedSubmit(true);

    const invalid = product.optionGroups.filter((g) => (selections[g.id] ?? []).length < g.min_select);
    if (invalid.length > 0) {
      const first = invalid[0];
      toast.error(`Escolha pelo menos ${first.min_select} ${first.min_select === 1 ? "opção" : "opções"} em "${first.name}".`);
      const el = groupRefs.current[first.id];
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
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
      <DialogContent
        style={themeStyle}
        className="w-[calc(100%-1.5rem)] max-h-[90vh] max-w-lg overflow-x-hidden overflow-y-auto border-[var(--store-border)] bg-[var(--store-card)] p-0 text-[var(--store-text)] sm:w-full"
      >
        <div className="min-w-0">
          <DialogHeader className="p-6 pb-3">
            {product.image_url && (
              <div className="relative -mx-6 -mt-6 mb-3 h-44 overflow-hidden bg-[var(--store-category-bg)]">
                <ImageWithFallback src={product.image_url} alt={product.name} fill sizes="600px" className="object-cover" showLabel={false} />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="text-[var(--store-text)]">{product.name}</DialogTitle>
              {soldOut && <Badge variant="secondary">Esgotado</Badge>}
            </div>
            {product.description && (
              <DialogDescription className="text-[var(--store-text-muted)]">{product.description}</DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-6 px-6 pb-5">
            <p className="text-xl font-bold text-[var(--store-price)]">{formatCurrencyBRL(basePrice)}</p>

            {product.optionGroups.map((group) => {
              const isInvalid = attemptedSubmit && (selections[group.id] ?? []).length < group.min_select;
              const pricingNote =
                group.pricing_mode === "fixed_price"
                  ? `+ ${formatCurrencyBRL(group.fixed_price)} ao escolher qualquer opção`
                  : describePricingRule(group);

              return (
                <div
                  key={group.id}
                  ref={(el) => {
                    groupRefs.current[group.id] = el;
                  }}
                  tabIndex={-1}
                  className={cn(
                    "min-w-0 rounded-lg outline-none",
                    isInvalid && "ring-2 ring-destructive ring-offset-2 ring-offset-[var(--store-card)]",
                  )}
                >
                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-[var(--store-text)]">{group.name}</p>
                    <Badge
                      variant="outline"
                      className="border-[var(--store-border)] bg-[var(--store-category-bg)] text-[var(--store-text)]"
                    >
                      {describeSelectionRule(group)}
                    </Badge>
                  </div>
                  {pricingNote && <p className="mt-0.5 text-xs text-[var(--store-text-muted)]">{pricingNote}</p>}
                  {isInvalid && (
                    <p className="mt-1 text-xs font-medium text-destructive">
                      Escolha {group.min_select === 1 ? "pelo menos 1 opção" : `pelo menos ${group.min_select} opções`}.
                    </p>
                  )}

                  {group.max_select === 1 ? (
                    <RadioGroup
                      className="mt-3 space-y-2"
                      value={selections[group.id]?.[0]}
                      onValueChange={(value) => toggleSingle(group.id, value)}
                    >
                      {group.options.map((option) => {
                        const selected = selections[group.id]?.[0] === option.id;
                        const charge = chargesByGroup.get(group.id)?.get(option.id) ?? 0;
                        const priceLabel = optionPriceLabel(group, option, selected, charge);
                        return (
                          <Label
                            key={option.id}
                            htmlFor={option.id}
                            className="flex min-w-0 cursor-pointer items-center justify-between gap-3 rounded-lg border border-[var(--store-border)] bg-[var(--store-card)] p-3 text-sm font-normal text-[var(--store-text)] has-[[data-state=checked]]:border-[var(--store-primary)] has-[[data-state=checked]]:bg-[var(--store-category-bg)]"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <RadioGroupItem value={option.id} id={option.id} />
                              <span className="truncate">{option.name}</span>
                            </span>
                            {priceLabel && (
                              <span
                                className={cn(
                                  "shrink-0",
                                  priceLabel === "Grátis" ? "font-medium text-[var(--store-price)]" : "text-[var(--store-text-muted)]",
                                )}
                              >
                                {priceLabel}
                              </span>
                            )}
                          </Label>
                        );
                      })}
                    </RadioGroup>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {group.options.map((option) => {
                        const selected = (selections[group.id] ?? []).includes(option.id);
                        const charge = chargesByGroup.get(group.id)?.get(option.id) ?? 0;
                        const priceLabel = optionPriceLabel(group, option, selected, charge);
                        return (
                          <Label
                            key={option.id}
                            htmlFor={option.id}
                            className="flex min-w-0 cursor-pointer items-center justify-between gap-3 rounded-lg border border-[var(--store-border)] bg-[var(--store-card)] p-3 text-sm font-normal text-[var(--store-text)] has-[[data-state=checked]]:border-[var(--store-primary)] has-[[data-state=checked]]:bg-[var(--store-category-bg)]"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <Checkbox
                                id={option.id}
                                checked={selected}
                                onCheckedChange={() => toggleMulti(group.id, option.id, group.max_select)}
                              />
                              <span className="truncate">{option.name}</span>
                            </span>
                            {priceLabel && (
                              <span
                                className={cn(
                                  "shrink-0",
                                  priceLabel === "Grátis" ? "font-medium text-[var(--store-price)]" : "text-[var(--store-text-muted)]",
                                )}
                              >
                                {priceLabel}
                              </span>
                            )}
                          </Label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="min-w-0">
              <Label htmlFor="notes" className="text-[var(--store-text)]">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Ex: sem cebola"
                className="mt-2 w-full max-w-full border-[var(--store-border)] bg-[var(--store-bg)] text-[var(--store-text)] placeholder:text-[var(--store-text-muted)]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex w-full min-w-0 flex-row flex-wrap items-center gap-3 border-t border-[var(--store-border)] bg-[var(--store-card)] p-4 sm:flex-nowrap sm:justify-between">
            <div className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--store-border)] bg-[var(--store-bg)] p-1 text-[var(--store-text)]">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={soldOut}
                className="rounded-full text-[var(--store-text)] hover:bg-[var(--store-category-bg)] hover:text-[var(--store-text)]"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <span className="w-4 text-center font-medium text-[var(--store-text)]">{quantity}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={soldOut}
                className="rounded-full text-[var(--store-text)] hover:bg-[var(--store-category-bg)] hover:text-[var(--store-text)]"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <Button
              className="min-w-0 flex-1 whitespace-normal"
              size="lg"
              disabled={soldOut}
              style={soldOut ? undefined : { backgroundColor: "var(--store-button)", color: "var(--store-button-text)" }}
              onClick={handleAdd}
            >
              {soldOut ? "Produto esgotado" : `Adicionar · ${formatCurrencyBRL(totalPrice)}`}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
