"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { couponInputSchema, type CouponInput } from "@/lib/validations/coupon";
import type { CouponWithLinks } from "@/lib/actions/painel/coupons";
import type { Coupon } from "@/types/database";
import type { MenuCategory } from "@/lib/data/menu";

const TYPE_LABELS: Record<CouponInput["type"], string> = {
  percent: "Porcentagem",
  fixed: "Valor fixo",
  free_shipping: "Frete grátis",
};

export function CouponForm({
  coupon,
  duplicateFrom,
  menu,
  onSubmit,
}: {
  coupon?: Coupon;
  duplicateFrom?: CouponWithLinks;
  menu: MenuCategory[];
  onSubmit: (values: CouponInput) => Promise<{ error?: string } | void>;
}) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const source = duplicateFrom ?? coupon;
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CouponInput>({
    resolver: zodResolver(couponInputSchema),
    defaultValues: {
      code: duplicateFrom ? "" : (coupon?.code ?? ""),
      type: source?.type ?? "percent",
      value: source?.value ?? 10,
      minOrderValue: source?.min_order_value ?? 0,
      maxDiscountValue: source?.max_discount_value ?? undefined,
      startsAt: source?.starts_at?.slice(0, 10) ?? "",
      endsAt: source?.ends_at?.slice(0, 10) ?? "",
      usageLimit: source?.usage_limit ?? undefined,
      usageLimitPerCustomer: source?.usage_limit_per_customer ?? undefined,
      active: duplicateFrom ? true : (coupon?.active ?? true),
      appliesToDelivery: source?.applies_to_delivery ?? true,
      appliesToPickup: source?.applies_to_pickup ?? true,
      firstPurchaseOnly: source?.first_purchase_only ?? false,
      appliesToAllProducts: source?.applies_to_all_products ?? true,
      categoryIds: duplicateFrom?.categoryIds ?? [],
      productIds: duplicateFrom?.productIds ?? [],
    },
  });

  async function handle(values: CouponInput) {
    setLoading(true);
    setServerError(null);
    const result = await onSubmit(values);
    setLoading(false);
    if (result?.error) setServerError(result.error);
  }

  const type = watch("type");
  const active = watch("active");
  const appliesToDelivery = watch("appliesToDelivery");
  const appliesToPickup = watch("appliesToPickup");
  const firstPurchaseOnly = watch("firstPurchaseOnly");
  const appliesToAllProducts = watch("appliesToAllProducts");
  const categoryIds = watch("categoryIds");
  const productIds = watch("productIds");

  function toggleCategory(id: string, checked: boolean) {
    setValue("categoryIds", checked ? [...categoryIds, id] : categoryIds.filter((c) => c !== id));
  }
  function toggleProduct(id: string, checked: boolean) {
    setValue("productIds", checked ? [...productIds, id] : productIds.filter((p) => p !== id));
  }

  return (
    <form onSubmit={handleSubmit(handle)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="code">Código</Label>
        <Input id="code" placeholder="BEMVINDO10" {...register("code")} />
        {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Qual tipo de desconto?</Label>
        <RadioGroup
          value={type}
          onValueChange={(v) => setValue("type", v as CouponInput["type"])}
          className="grid grid-cols-3 gap-2"
        >
          {(Object.keys(TYPE_LABELS) as CouponInput["type"][]).map((t) => (
            <Label
              key={t}
              className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-3 text-center text-xs has-[[data-state=checked]]:border-primary"
            >
              <RadioGroupItem value={t} />
              {TYPE_LABELS[t]}
            </Label>
          ))}
        </RadioGroup>
      </div>

      {type !== "free_shipping" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="value">{type === "percent" ? "Porcentagem (%)" : "Valor (R$)"}</Label>
            <Input id="value" type="number" step="0.01" {...register("value", { valueAsNumber: true })} />
            {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
          </div>
          {type === "percent" && (
            <div className="space-y-1.5">
              <Label htmlFor="maxDiscountValue">Desconto máximo (R$, opcional)</Label>
              <Input
                id="maxDiscountValue"
                type="number"
                step="0.01"
                placeholder="Sem limite"
                {...register("maxDiscountValue", {
                  setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
                })}
              />
            </div>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="minOrderValue">Pedido mínimo (R$)</Label>
        <Input id="minOrderValue" type="number" step="0.01" {...register("minOrderValue", { valueAsNumber: true })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="startsAt">Data inicial</Label>
          <Input id="startsAt" type="date" {...register("startsAt")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endsAt">Validade</Label>
          <Input id="endsAt" type="date" {...register("endsAt")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="usageLimit">Limite total de usos</Label>
          <Input
            id="usageLimit"
            type="number"
            placeholder="Sem limite"
            {...register("usageLimit", { setValueAs: (v) => (v === "" || v == null ? null : Number(v)) })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="usageLimitPerCustomer">Limite por cliente</Label>
          <Input
            id="usageLimitPerCustomer"
            type="number"
            placeholder="Sem limite"
            {...register("usageLimitPerCustomer", { setValueAs: (v) => (v === "" || v == null ? null : Number(v)) })}
          />
        </div>
      </div>

      <div className="space-y-2 rounded-xl border p-3">
        <p className="text-sm font-medium">Vale para</p>
        <label className="flex items-center justify-between text-sm">
          Entrega
          <Switch checked={appliesToDelivery} onCheckedChange={(v) => setValue("appliesToDelivery", v)} />
        </label>
        <label className="flex items-center justify-between text-sm">
          Retirada
          <Switch checked={appliesToPickup} onCheckedChange={(v) => setValue("appliesToPickup", v)} />
        </label>
        {errors.appliesToDelivery && <p className="text-xs text-destructive">{errors.appliesToDelivery.message}</p>}
        <label className="flex items-center justify-between text-sm">
          Somente primeira compra do cliente
          <Switch checked={firstPurchaseOnly} onCheckedChange={(v) => setValue("firstPurchaseOnly", v)} />
        </label>
      </div>

      <div className="space-y-2 rounded-xl border p-3">
        <label className="flex items-center justify-between text-sm font-medium">
          Todos os produtos
          <Switch checked={appliesToAllProducts} onCheckedChange={(v) => setValue("appliesToAllProducts", v)} />
        </label>
        {!appliesToAllProducts && (
          <div className="max-h-48 space-y-3 overflow-y-auto pt-1">
            {menu.length === 0 && <p className="text-xs text-muted-foreground">Nenhum produto cadastrado ainda.</p>}
            {menu.map((category) => (
              <div key={category.id}>
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Checkbox
                    checked={categoryIds.includes(category.id)}
                    onCheckedChange={(v) => toggleCategory(category.id, v === true)}
                  />
                  {category.name} (toda a categoria)
                </label>
                <div className="ml-6 mt-1 space-y-1">
                  {category.products.map((product) => (
                    <label key={product.id} className="flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={productIds.includes(product.id)}
                        onCheckedChange={(v) => toggleProduct(product.id, v === true)}
                      />
                      {product.name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="active">Ativo</Label>
        <Switch id="active" checked={active} onCheckedChange={(v) => setValue("active", v)} />
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Salvando..." : "Salvar cupom"}
      </Button>
    </form>
  );
}
