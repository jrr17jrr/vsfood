"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { restaurantAppearanceSchema, type RestaurantAppearanceInput } from "@/lib/validations/restaurant";
import { updateAppearanceAction } from "@/lib/actions/painel/settings";
import { uploadRestaurantBanner, uploadRestaurantLogo } from "@/lib/storage";
import type { Restaurant } from "@/types/database";

export function AppearanceForm({ restaurant }: { restaurant: Restaurant }) {
  const [logoUrl, setLogoUrl] = useState(restaurant.logo_url ?? "");
  const [bannerUrl, setBannerUrl] = useState(restaurant.banner_url ?? "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RestaurantAppearanceInput>({
    resolver: zodResolver(restaurantAppearanceSchema),
    defaultValues: {
      name: restaurant.name,
      description: restaurant.description ?? "",
      cuisineType: restaurant.cuisine_type ?? "",
      primaryColor: restaurant.primary_color,
      whatsapp: restaurant.whatsapp ?? "",
      instagram: restaurant.instagram ?? "",
      phone: restaurant.phone ?? "",
      cep: restaurant.cep ?? "",
      street: restaurant.street ?? "",
      number: restaurant.number ?? "",
      complement: restaurant.complement ?? "",
      neighborhood: restaurant.neighborhood ?? "",
      city: restaurant.city ?? "",
      state: restaurant.state ?? "",
      minOrderValue: restaurant.min_order_value,
      estimatedTimeMinutes: restaurant.estimated_time_minutes,
    },
  });

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      setLogoUrl(await uploadRestaurantLogo(restaurant.id, file));
    } catch {
      toast.error("Não foi possível enviar a logo.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      setBannerUrl(await uploadRestaurantBanner(restaurant.id, file));
    } catch {
      toast.error("Não foi possível enviar o banner.");
    } finally {
      setUploadingBanner(false);
    }
  }

  async function onSubmit(values: RestaurantAppearanceInput) {
    setLoading(true);
    const result = await updateAppearanceAction({ ...values, logoUrl, bannerUrl });
    setLoading(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Loja atualizada.");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Logo</Label>
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="relative mt-2 flex size-24 items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-muted p-2"
          >
            {uploadingLogo ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : logoUrl ? (
              <Image src={logoUrl} alt="" fill sizes="96px" className="object-contain" />
            ) : (
              <ImagePlus className="size-5 text-muted-foreground" />
            )}
          </button>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          <p className="mt-1 text-xs text-muted-foreground">Tamanho recomendado: 512x512px</p>
        </div>
        <div>
          <Label>Banner</Label>
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            className="relative mt-2 flex aspect-[8/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-muted"
          >
            {uploadingBanner ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : bannerUrl ? (
              <Image src={bannerUrl} alt="" fill sizes="400px" className="object-contain sm:object-cover" />
            ) : (
              <ImagePlus className="size-5 text-muted-foreground" />
            )}
          </button>
          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
          <p className="mt-1 text-xs text-muted-foreground">Tamanho recomendado: 1920x720px</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Nome da loja</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" {...register("description")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cuisineType">Tipo de cozinha</Label>
          <Input id="cuisineType" {...register("cuisineType")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="primaryColor">Cor principal</Label>
          <div className="flex items-center gap-2">
            <Input id="primaryColor" type="color" className="h-10 w-16 p-1" {...register("primaryColor")} />
            <Input {...register("primaryColor")} className="flex-1" />
          </div>
          {errors.primaryColor && <p className="text-xs text-destructive">{errors.primaryColor.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" {...register("whatsapp")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="instagram">Instagram</Label>
          <Input id="instagram" placeholder="@seurestaurante" {...register("instagram")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" {...register("phone")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="cep">CEP</Label>
          <Input id="cep" {...register("cep")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="street">Rua</Label>
          <Input id="street" {...register("street")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="number">Número</Label>
          <Input id="number" {...register("number")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="complement">Complemento</Label>
          <Input id="complement" {...register("complement")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input id="neighborhood" {...register("neighborhood")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" {...register("city")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">UF</Label>
          <Input id="state" maxLength={2} {...register("state")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="minOrderValue">Pedido mínimo (R$)</Label>
          <Input id="minOrderValue" type="number" step="0.01" {...register("minOrderValue", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="estimatedTimeMinutes">Tempo estimado (min)</Label>
          <Input id="estimatedTimeMinutes" type="number" {...register("estimatedTimeMinutes", { valueAsNumber: true })} />
        </div>
      </div>

      <Button type="submit" disabled={loading || uploadingLogo || uploadingBanner}>
        {loading ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
