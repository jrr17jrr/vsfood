"use client";

import { useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createRestaurantByAdminSchema,
  type CreateRestaurantByAdminInput,
} from "@/lib/validations/admin-restaurant";
import { createRestaurantByAdminAction, linkExistingOwnerAction } from "@/lib/actions/admin/create-restaurant";
import type { RestaurantStatus } from "@/types/database";

const STATUS_OPTIONS: { value: RestaurantStatus; label: string }[] = [
  { value: "trial", label: "Em teste" },
  { value: "active", label: "Ativo" },
  { value: "expired", label: "Expirado" },
  { value: "suspended", label: "Suspenso" },
];

type SuccessState = { name: string; slug: string; ownerEmail: string; password: string };
type ConflictState = { profileId: string; ownerName: string } | null;

export function CreateRestaurantAdminForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ConflictState>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    control,
    formState: { errors },
  } = useForm<CreateRestaurantByAdminInput>({
    resolver: zodResolver(createRestaurantByAdminSchema),
    defaultValues: { plan: "basic", trialDays: 7, status: "trial" },
  });

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
        plan: values.plan,
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
      <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-6 text-center">
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome do restaurante</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">Slug (usado na URL da loja)</Label>
        <Input id="slug" placeholder="ex: dudu-burger" {...register("slug")} />
        {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="plan">Plano</Label>
          <Input id="plan" {...register("plan")} />
          {errors.plan && <p className="text-xs text-destructive">{errors.plan.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="trialDays">Dias de teste</Label>
          <Input id="trialDays" type="number" min={0} {...register("trialDays", { valueAsNumber: true })} />
          {errors.trialDays && <p className="text-xs text-destructive">{errors.trialDays.message}</p>}
        </div>
      </div>

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
    </form>
  );
}
