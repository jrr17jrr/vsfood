"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { planFeatureSchema, type PlanFeatureInput } from "@/lib/validations/plan";
import { upsertPlanFeatureAction, togglePlanFeatureActiveAction } from "@/lib/actions/admin/plans";
import type { PlanFeature } from "@/types/database";

function FeatureRow({ feature }: { feature: PlanFeature }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle(checked: boolean) {
    setLoading(true);
    const result = await togglePlanFeatureActiveAction(feature.id, checked);
    setLoading(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3">
      <div>
        <p className="text-sm font-medium">{feature.name}</p>
        <p className="text-xs text-muted-foreground">
          {feature.key} · ordem {feature.display_order}
          {feature.description ? ` · ${feature.description}` : ""}
        </p>
      </div>
      <label className="flex items-center gap-2">
        <Switch checked={feature.is_active} disabled={loading} onCheckedChange={handleToggle} />
        <span className="text-xs text-muted-foreground">{feature.is_active ? "Ativa" : "Inativa"}</span>
      </label>
    </div>
  );
}

function NewFeatureForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlanFeatureInput>({
    resolver: zodResolver(planFeatureSchema),
    defaultValues: { isActive: true, displayOrder: 0 },
  });

  async function onSubmit(values: PlanFeatureInput) {
    setServerError(null);
    setLoading(true);
    const result = await upsertPlanFeatureAction(null, values);
    setLoading(false);
    if (result?.error) {
      setServerError(result.error);
      return;
    }
    toast.success("Funcionalidade criada.");
    reset({ key: "", name: "", description: "", isActive: true, displayOrder: 0 });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border bg-card p-4">
      <h2 className="text-sm font-semibold">Nova funcionalidade</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="key">Chave interna</Label>
          <Input id="key" placeholder="ex: loyalty_program" {...register("key")} />
          {errors.key && <p className="text-xs text-destructive">{errors.key.message}</p>}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Input id="description" {...register("description")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="displayOrder">Ordem</Label>
          <Input id="displayOrder" type="number" {...register("displayOrder", { valueAsNumber: true })} />
        </div>
      </div>
      {serverError && <p className="mt-2 text-sm text-destructive">{serverError}</p>}
      <Button type="submit" className="mt-3" disabled={loading}>
        <Plus className="size-4" />
        {loading ? "Criando..." : "Adicionar funcionalidade"}
      </Button>
    </form>
  );
}

export function PlanFeaturesManager({ features }: { features: PlanFeature[] }) {
  return (
    <div className="space-y-6">
      <NewFeatureForm />
      <div className="space-y-2">
        {features.map((f) => (
          <FeatureRow key={f.id} feature={f} />
        ))}
        {features.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma funcionalidade cadastrada.</p>}
      </div>
    </div>
  );
}
