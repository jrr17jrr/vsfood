"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { addressInputSchema, type AddressInput } from "@/lib/validations/checkout";
import type { CustomerAddress } from "@/types/database";

export function AddressForm({
  address,
  onSubmit,
  submitLabel = "Salvar endereço",
}: {
  address?: CustomerAddress;
  onSubmit: (values: AddressInput & { isDefault: boolean }) => Promise<{ error?: string } | void>;
  submitLabel?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(address?.is_default ?? false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressInputSchema),
    defaultValues: {
      label: address?.label ?? "",
      cep: address?.cep ?? "",
      street: address?.street ?? "",
      number: address?.number ?? "",
      complement: address?.complement ?? "",
      neighborhood: address?.neighborhood ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
      reference: address?.reference ?? "",
    },
  });

  async function handle(values: AddressInput) {
    setLoading(true);
    setServerError(null);
    const result = await onSubmit({ ...values, isDefault });
    setLoading(false);
    if (result?.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(handle)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="label">Identificação (opcional)</Label>
          <Input id="label" placeholder="Casa, trabalho..." {...register("label")} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="cep">CEP</Label>
          <Input id="cep" {...register("cep")} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="street">Rua</Label>
          <Input id="street" {...register("street")} />
          {errors.street && <p className="text-xs text-destructive">{errors.street.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="number">Número</Label>
          <Input id="number" {...register("number")} />
          {errors.number && <p className="text-xs text-destructive">{errors.number.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="complement">Complemento</Label>
          <Input id="complement" {...register("complement")} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input id="neighborhood" {...register("neighborhood")} />
          {errors.neighborhood && <p className="text-xs text-destructive">{errors.neighborhood.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" {...register("city")} />
          {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">UF</Label>
          <Input id="state" maxLength={2} {...register("state")} />
          {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="reference">Ponto de referência</Label>
          <Input id="reference" {...register("reference")} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={isDefault} onCheckedChange={(v) => setIsDefault(v === true)} />
        Usar como endereço padrão
      </label>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}
