"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { slugifyName } from "@/lib/slug";
import {
  createRestaurantByAdminSchema,
  type CreateRestaurantByAdminInput,
} from "@/lib/validations/admin-restaurant";
import {
  createRestaurantByAdminAction,
  linkExistingOwnerAction,
  checkSlugAvailabilityAction,
} from "@/lib/actions/admin/create-restaurant";
import type { ActivePlanOption } from "@/lib/data/plans";
import type { AccessType, RestaurantStatus } from "@/types/database";

const STATUS_OPTIONS: { value: RestaurantStatus; label: string }[] = [
  { value: "active", label: "Ativo" },
  { value: "suspended", label: "Suspenso" },
  { value: "expired", label: "Expirado" },
];

const ACCESS_TYPE_OPTIONS: { value: AccessType; label: string; description: string }[] = [
  { value: "trial", label: "Teste grátis", description: "Loja funciona por N dias, depois pede assinatura." },
  { value: "subscriber", label: "Assinante", description: "Loja já paga pelo plano, sem prazo de teste." },
  { value: "demo", label: "Demonstração", description: "Não expira, não é cobrada e não entra no MRR." },
];

type SuccessState = { name: string; slug: string; ownerEmail: string; password: string };
type ConflictState = { profileId: string; ownerName: string } | null;
type SlugStatus = "idle" | "checking" | "available" | "taken";

export function CreateRestaurantAdminForm({
  plans,
  trialDefaults,
}: {
  plans: ActivePlanOption[];
  trialDefaults: { days: number; planId: string | null };
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ConflictState>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [loading, setLoading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [planTouched, setPlanTouched] = useState(false);
  const [trialDaysTouched, setTrialDaysTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateRestaurantByAdminInput>({
    resolver: zodResolver(createRestaurantByAdminSchema),
    defaultValues: {
      planId: trialDefaults.planId ?? plans[0]?.id ?? "",
      accessType: "trial",
      trialDays: trialDefaults.days,
      status: "active",
      slug: "",
    },
  });

  const name = watch("name");
  const slug = watch("slug");
  const planId = watch("planId");
  const accessType = watch("accessType");
  const ownerName = watch("ownerName");

  useEffect(() => {
    if (slugTouched) return;
    setValue("slug", slugifyName(name || ""));
  }, [name, slugTouched, setValue]);

  // Teste grátis usa a configuração global (dias/plano padrão) como ponto de
  // partida — o DEV ainda pode sobrescrever pra este restaurante específico
  // sem alterar a config global (os campos só respeitam esse default enquanto
  // não forem tocados manualmente).
  useEffect(() => {
    if (accessType !== "trial") return;
    if (!planTouched && trialDefaults.planId) setValue("planId", trialDefaults.planId);
    if (!trialDaysTouched) setValue("trialDays", trialDefaults.days);
  }, [accessType, planTouched, trialDaysTouched, trialDefaults, setValue]);

  useEffect(() => {
    if (!slug || slug.length < 2) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const timeout = setTimeout(async () => {
      const result = await checkSlugAvailabilityAction(slug);
      setSlugStatus(result.available ? "available" : "taken");
    }, 400);
    return () => clearTimeout(timeout);
  }, [slug]);

  async function onSubmit(values: CreateRestaurantByAdminInput) {
    setServerError(null);
    setConflict(null);
    setLoading(true);
    try {
      const result = await createRestaurantByAdminAction(values);
      if ("error" in result) {
        setServerError(result.error);
        if (result.existingProfile) {
          setConflict({ profileId: result.existingProfile.id, ownerName: result.existingProfile.name });
        }
        return;
      }
      setSuccess({ ...result, password: values.password });
    } finally {
      setLoading(false);
    }
  }

  async function handleLinkExisting() {
    if (!conflict) return;
    const values = getValues();
    setServerError(null);
    setLoading(true);
    try {
      const result = await linkExistingOwnerAction({
        profileId: conflict.profileId,
        name: values.name,
        slug: values.slug,
        planId: values.planId,
        accessType: values.accessType,
        trialDays: values.trialDays,
        status: values.status,
      });
      if ("error" in result) {
        setServerError(result.error);
        return;
      }
      setSuccess({ ...result, password: "(a conta já existia — a senha não foi alterada)" });
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    const storeUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/loja/${success.slug}`;
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border bg-card p-6 text-center">
        <CheckCircle2 className="size-10 text-primary" />
        <div>
          <p className="text-lg font-semibold">Restaurante criado com sucesso</p>
          <p className="mt-1 text-sm text-muted-foreground">Compartilhe o acesso abaixo com o responsável.</p>
        </div>
        <div className="w-full space-y-2 rounded-xl border bg-secondary/30 p-4 text-left text-sm">
          <p>
            <span className="text-muted-foreground">Nome:</span> <span className="font-medium">{success.name}</span>
          </p>
          <p>
            <span className="text-muted-foreground">URL da loja:</span>{" "}
            <Link href={`/loja/${success.slug}`} className="font-medium text-primary hover:underline">
              {storeUrl}
            </Link>
          </p>
          <p>
            <span className="text-muted-foreground">E-mail do responsável:</span>{" "}
            <span className="font-medium">{success.ownerEmail}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Senha inicial:</span>{" "}
            <span className="font-medium">{success.password}</span>
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Anote a senha agora — ela não será exibida novamente. O responsável pode entrar em{" "}
          <Link href="/login" className="underline">
            /login
          </Link>
          .
        </p>
        <Button asChild>
          <Link href="/admin/restaurantes">Voltar para restaurantes</Link>
        </Button>
      </div>
    );
  }

  const selectedPlan = plans.find((p) => p.id === planId);
  const accessLabel = ACCESS_TYPE_OPTIONS.find((o) => o.value === accessType)?.label ?? "";

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr_320px]">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">Dados da loja e responsável</h2>
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome do restaurante</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ownerName">Nome do responsável</Label>
            <Input id="ownerName" {...register("ownerName")} />
            {errors.ownerName && <p className="text-xs text-destructive">{errors.ownerName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="whatsapp">WhatsApp do responsável</Label>
            <Input id="whatsapp" placeholder="(11) 99999-9999" {...register("whatsapp")} />
            {errors.whatsapp && <p className="text-xs text-destructive">{errors.whatsapp.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail do responsável</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Senha inicial</Label>
            <Input id="password" type="text" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">Endereço, tipo de acesso e plano</h2>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug (usado na URL da loja)</Label>
            <Input
              id="slug"
              placeholder="ex: dudu-burger"
              {...register("slug", {
                onChange: () => setSlugTouched(true),
              })}
            />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            {!errors.slug && slugStatus === "checking" && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> Verificando disponibilidade...
              </p>
            )}
            {!errors.slug && slugStatus === "available" && <p className="text-xs text-primary">Slug disponível</p>}
            {!errors.slug && slugStatus === "taken" && (
              <p className="text-xs text-destructive">Este endereço já está sendo utilizado.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="planId">Plano</Label>
            <Controller
              control={control}
              name="planId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    setPlanTouched(true);
                    field.onChange(value);
                  }}
                >
                  <SelectTrigger id="planId">
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
            {errors.planId && <p className="text-xs text-destructive">{errors.planId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Tipo de acesso</Label>
            <Controller
              control={control}
              name="accessType"
              render={({ field }) => (
                <RadioGroup value={field.value} onValueChange={field.onChange}>
                  {ACCESS_TYPE_OPTIONS.map((o) => (
                    <label
                      key={o.value}
                      className="flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5"
                    >
                      <RadioGroupItem value={o.value} className="mt-0.5" />
                      <span>
                        <span className="block text-sm font-medium">{o.label}</span>
                        <span className="block text-xs text-muted-foreground">{o.description}</span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              )}
            />
          </div>

          {accessType === "trial" && (
            <div className="space-y-1.5">
              <Label htmlFor="trialDays">Dias de teste</Label>
              <Input
                id="trialDays"
                type="number"
                min={0}
                {...register("trialDays", { valueAsNumber: true, onChange: () => setTrialDaysTouched(true) })}
              />
              {errors.trialDays && <p className="text-xs text-destructive">{errors.trialDays.message}</p>}
            </div>
          )}

          {accessType === "subscriber" && (
            <div className="space-y-1.5">
              <Label htmlFor="status">Status inicial</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2 xl:col-span-1">
          <div className="rounded-2xl border bg-card p-4">
            <h2 className="text-sm font-semibold">Resumo da nova loja</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Nome</dt>
                <dd className="font-medium">{name || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">URL</dt>
                <dd className="font-medium break-all">/loja/{slug || "..."}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Responsável</dt>
                <dd className="font-medium">{ownerName || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Tipo de acesso</dt>
                <dd className="font-medium">{accessLabel}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Plano</dt>
                <dd className="font-medium">{selectedPlan?.name ?? "—"}</dd>
              </div>
            </dl>
          </div>

          {serverError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <p>{serverError}</p>
              {conflict && (
                <>
                  <p className="mt-1 text-xs">
                    Conta existente: <span className="font-medium">{conflict.ownerName}</span>
                  </p>
                  <Button type="button" variant="outline" size="sm" className="mt-2" disabled={loading} onClick={handleLinkExisting}>
                    Vincular conta existente como responsável
                  </Button>
                </>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando restaurante..." : "Criar restaurante"}
          </Button>
        </div>
      </div>
    </form>
  );
}
