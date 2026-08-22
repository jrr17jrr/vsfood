"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { couponInputSchema, type CouponInput } from "@/lib/validations/coupon";
import type { Coupon } from "@/types/database";

export function CouponForm({
  coupon,
  onSubmit,
}: {
  coupon?: Coupon;
  onSubmit: (values: CouponInput) => Promise<{ error?: string } | void>;
}) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CouponInput>({
    resolver: zodResolver(couponInputSchema),
    defaultValues: {
      code: coupon?.code ?? "",
      type: coupon?.type ?? "percent",
      value: coupon?.value ?? 10,
      minOrderValue: coupon?.min_order_value ?? 0,
      startsAt: coupon?.starts_at?.slice(0, 10) ?? "",
      endsAt: coupon?.ends_at?.slice(0, 10) ?? "",
      usageLimit: coupon?.usage_limit ?? undefined,
      active: coupon?.active ?? true,
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

  return (
    <form onSubmit={handleSubmit(handle)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="code">Código</Label>
        <Input id="code" placeholder="BEMVINDO10" {...register("code")} />
        {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Tipo de desconto</Label>
        <RadioGroup value={type} onValueChange={(v) => setValue("type", v as "percent" | "fixed")} className="grid grid-cols-2 gap-3">
          <Label className="flex cursor-pointer items-center gap-2 rounded-xl border p-3 has-[[data-state=checked]]:border-primary">
            <RadioGroupItem value="percent" />
            Porcentagem
          </Label>
          <Label className="flex cursor-pointer items-center gap-2 rounded-xl border p-3 has-[[data-state=checked]]:border-primary">
            <RadioGroupItem value="fixed" />
            Valor fixo
          </Label>
        </RadioGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="value">{type === "percent" ? "Porcentagem (%)" : "Valor (R$)"}</Label>
          <Input id="value" type="number" step="0.01" {...register("value", { valueAsNumber: true })} />
          {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="minOrderValue">Pedido mínimo (R$)</Label>
          <Input id="minOrderValue" type="number" step="0.01" {...register("minOrderValue", { valueAsNumber: true })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="startsAt">Data inicial</Label>
          <Input id="startsAt" type="date" {...register("startsAt")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endsAt">Data final</Label>
          <Input id="endsAt" type="date" {...register("endsAt")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="usageLimit">Limite de usos (opcional)</Label>
        <Input id="usageLimit" type="number" {...register("usageLimit", { valueAsNumber: true })} />
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
