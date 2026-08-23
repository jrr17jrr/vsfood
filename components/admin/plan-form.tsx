"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { planSchema, type PlanInput } from "@/lib/validations/plan";
import { createPlanAction, updatePlanAction } from "@/lib/actions/admin/plans";
import type { PlanDetail } from "@/lib/data/plans";
import type { PlanFeature } from "@/types/database";

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function PlanForm({ plan, allFeatures }: { plan: PlanDetail | null; allFeatures: PlanFeature[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [featureIds, setFeatureIds] = useState<Set<string>>(new Set(plan?.feature_ids ?? []));

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PlanInput>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      code: plan?.code ?? "",
      name: plan?.name ?? "",
      description: plan?.description ?? "",
      complementText: plan?.complement_text ?? "",
      ctaLabel: plan?.cta_label ?? "Quero minha loja",
      priceMonthly: plan?.price_monthly ?? null,
      priceYearly: plan?.price_yearly ?? null,
      isFeatured: plan?.is_featured ?? false,
      isActive: plan?.is_active ?? true,
      displayOrder: plan?.display_order ?? 0,
      trialDaysDefault: plan?.trial_days_default ?? 7,
    },
  });

  function toggleFeature(id: string, checked: boolean) {
    setFeatureIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function onSubmit(values: PlanInput) {
    setServerError(null);
    setLoading(true);
    try {
      const result = plan
        ? await updatePlanAction(plan.id, values, [...featureIds])
        : await createPlanAction(values, [...featureIds]);
      if (result?.error) {
        setServerError(result.error);
        return;
      }
      toast.success(plan ? "Plano atualizado." : "Plano criado.");
      router.push("/admin/planos");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome do plano</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="code">Código interno</Label>
          <Input id="code" placeholder="ex: basic" {...register("code")} />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" rows={2} {...register("description")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="complementText">Texto complementar</Label>
          <Input id="complementText" placeholder="ex: Cobrado mensalmente" {...register("complementText")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ctaLabel">Texto do CTA</Label>
          <Input id="ctaLabel" {...register("ctaLabel")} />
          {errors.ctaLabel && <p className="text-xs text-destructive">{errors.ctaLabel.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="priceMonthly">Preço mensal (R$)</Label>
            <Controller
              control={control}
              name="priceMonthly"
              render={({ field }) => (
                <Input
                  id="priceMonthly"
                  inputMode="decimal"
                  placeholder="Em breve"
                  defaultValue={field.value ?? ""}
                  onChange={(e) => field.onChange(toNullableNumber(e.target.value))}
                />
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="priceYearly">Preço anual (R$)</Label>
            <Controller
              control={control}
              name="priceYearly"
              render={({ field }) => (
                <Input
                  id="priceYearly"
                  inputMode="decimal"
                  placeholder="Opcional"
                  defaultValue={field.value ?? ""}
                  onChange={(e) => field.onChange(toNullableNumber(e.target.value))}
                />
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="displayOrder">Ordem na página de venda</Label>
            <Input id="displayOrder" type="number" {...register("displayOrder", { valueAsNumber: true })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trialDaysDefault">Dias de teste padrão</Label>
            <Input id="trialDaysDefault" type="number" min={0} {...register("trialDaysDefault", { valueAsNumber: true })} />
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <Controller
            control={control}
            name="isFeatured"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm font-medium">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                Destaque (&quot;Mais escolhido&quot;)
              </label>
            )}
          />
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm font-medium">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                Ativo
              </label>
            )}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border bg-card p-4">
          <h2 className="text-sm font-semibold">Funcionalidades incluídas</h2>
          <div className="mt-3 max-h-96 space-y-2 overflow-y-auto">
            {allFeatures.map((f) => (
              <label key={f.id} className="flex items-start gap-2.5 text-sm">
                <Checkbox
                  checked={featureIds.has(f.id)}
                  onCheckedChange={(checked) => toggleFeature(f.id, checked === true)}
                  className="mt-0.5"
                />
                <span>
                  {f.name}
                  {!f.is_active && <span className="ml-1 text-xs text-muted-foreground">(inativa)</span>}
                </span>
              </label>
            ))}
            {allFeatures.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma funcionalidade cadastrada ainda — gerencie em{" "}
                <Link href="/admin/planos/funcionalidades" className="underline">
                  /admin/planos/funcionalidades
                </Link>
                .
              </p>
            )}
          </div>
        </div>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Salvando..." : plan ? "Salvar plano" : "Criar plano"}
        </Button>
      </div>
    </form>
  );
}
