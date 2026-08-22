"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRestaurantSchema, type CreateRestaurantInput } from "@/lib/validations/restaurant";
import { createRestaurantAction } from "@/lib/actions/painel/onboarding";

export function CreateRestaurantForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRestaurantInput>({ resolver: zodResolver(createRestaurantSchema) });

  async function onSubmit(values: CreateRestaurantInput) {
    setServerError(null);
    setLoading(true);
    try {
      const result = await createRestaurantAction(values);
      if (result?.error) setServerError(result.error);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome do restaurante</Label>
        <Input id="name" placeholder="Ex: Dudu Burger" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cuisineType">Tipo de cozinha</Label>
        <Input id="cuisineType" placeholder="Ex: Hambúrgueria, Pizzaria, Açaí..." {...register("cuisineType")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="whatsapp">WhatsApp da loja</Label>
        <Input id="whatsapp" placeholder="(11) 99999-9999" {...register("whatsapp")} />
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Criando loja..." : "Criar minha loja"}
      </Button>
    </form>
  );
}
