"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trialSettingsSchema, type TrialSettingsInput } from "@/lib/validations/trial-settings";
import { updateTrialSettingsAction } from "@/lib/actions/admin/trial-settings";
import { formatTrialHeadline } from "@/lib/trial";
import type { AdminTrialSettings } from "@/lib/data/trial-settings";
import type { ActivePlanOption } from "@/lib/data/plans";

export function TrialSettingsForm({ settings, plans }: { settings: AdminTrialSettings; plans: ActivePlanOption[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<TrialSettingsInput>({
    resolver: zodResolver(trialSettingsSchema),
    defaultValues: {
      isActive: settings.is_active,
      defaultDays: settings.default_days,
      defaultPlanId: settings.default_plan_id ?? plans[0]?.id ?? "",
      headlineTemplate: settings.headline_template,
    },
  });

  const days = watch("defaultDays");
  const headlineTemplate = watch("headlineTemplate");

  async function onSubmit(values: TrialSettingsInput) {
    setServerError(null);
    setLoading(true);
    try {
      const result = await updateTrialSettingsAction(values);
      if (result?.error) {
        setServerError(result.error);
        return;
      }
      toast.success("Configuração do teste grátis salva.");
      router.push("/admin/planos");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <Controller
        control={control}
        name="isActive"
        render={({ field }) => (
          <label className="flex items-center justify-between rounded-2xl border bg-card p-4">
            <span>
              <span className="block text-sm font-medium">Teste grátis ativo</span>
              <span className="block text-xs text-muted-foreground">
                Controla se a home anuncia o teste grátis. Não afeta lojas já criadas.
              </span>
            </span>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </label>
        )}
      />

      <div className="space-y-1.5">
        <Label htmlFor="defaultDays">Duração padrão (dias)</Label>
        <Input id="defaultDays" type="number" min={0} {...register("defaultDays", { valueAsNumber: true })} />
        {errors.defaultDays && <p className="text-xs text-destructive">{errors.defaultDays.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="defaultPlanId">Plano padrão durante o teste</Label>
        <Controller
          control={control}
          name="defaultPlanId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="defaultPlanId">
                <SelectValue placeholder="Selecionar plano" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.defaultPlanId && <p className="text-xs text-destructive">{errors.defaultPlanId.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="headlineTemplate">Texto exibido na página de venda</Label>
        <Input id="headlineTemplate" {...register("headlineTemplate")} />
        <p className="text-xs text-muted-foreground">
          Use <code className="rounded bg-secondary px-1">{"{days}"}</code> onde a quantidade de dias deve aparecer.
        </p>
        {errors.headlineTemplate && <p className="text-xs text-destructive">{errors.headlineTemplate.message}</p>}
        <p className="text-xs text-muted-foreground">
          Prévia: &ldquo;{formatTrialHeadline(headlineTemplate || "", days || 0)}&rdquo;
        </p>
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Salvando..." : "Salvar configuração"}
      </Button>
    </form>
  );
}
