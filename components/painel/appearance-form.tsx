"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ImagePlus, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { ColorField } from "@/components/painel/color-field";
import { StoreThemePreview } from "@/components/painel/store-theme-preview";
import { restaurantAppearanceSchema, type RestaurantAppearanceInput } from "@/lib/validations/restaurant";
import { resetThemeAction, updateAppearanceAction } from "@/lib/actions/painel/settings";
import { uploadRestaurantBanner, uploadRestaurantLogo } from "@/lib/storage";
import { parseStoreTheme, getContrastWarnings, THEME_PRESETS, DEFAULT_STORE_THEME } from "@/lib/theme/store-theme";
import type { Restaurant } from "@/types/database";

export function AppearanceForm({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState(restaurant.logo_url ?? "");
  const [bannerUrl, setBannerUrl] = useState(restaurant.banner_url ?? "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RestaurantAppearanceInput>({
    resolver: zodResolver(restaurantAppearanceSchema),
    defaultValues: {
      name: restaurant.name,
      description: restaurant.description ?? "",
      cuisineType: restaurant.cuisine_type ?? "",
      theme: parseStoreTheme(restaurant.theme),
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

  const watchedTheme = watch("theme");
  const watchedName = watch("name");
  const contrastWarnings = getContrastWarnings(watchedTheme);

  function applyPreset(presetTheme: (typeof THEME_PRESETS)[number]["theme"]) {
    for (const key of Object.keys(presetTheme) as (keyof typeof presetTheme)[]) {
      setValue(`theme.${key}`, presetTheme[key], { shouldDirty: true });
    }
  }

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
    router.refresh();
  }

  async function handleRestoreDefault() {
    setRestoring(true);
    const result = await resetThemeAction();
    setRestoring(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    for (const key of Object.keys(DEFAULT_STORE_THEME) as (keyof typeof DEFAULT_STORE_THEME)[]) {
      setValue(`theme.${key}`, DEFAULT_STORE_THEME[key], { shouldDirty: true });
    }
    toast.success("Cores restauradas ao padrão.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-10">
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Logo e banner</h2>
          <p className="text-sm text-muted-foreground">Imagens exibidas no topo da sua loja pública.</p>
        </div>
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
                <ImageWithFallback src={logoUrl} alt="" fill sizes="96px" className="object-contain" showLabel={false} />
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
              className="relative mt-2 flex aspect-[3/2] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-muted sm:aspect-[8/3]"
            >
              {uploadingBanner ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : bannerUrl ? (
                <ImageWithFallback
                  src={bannerUrl}
                  alt=""
                  fill
                  sizes="400px"
                  className="object-cover object-center"
                  showLabel={false}
                />
              ) : (
                <ImagePlus className="size-5 text-muted-foreground" />
              )}
            </button>
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
            <p className="mt-1 text-xs text-muted-foreground">Tamanho recomendado: 1920x720px</p>
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Informações da loja</h2>
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
        <div className="space-y-1.5">
          <Label htmlFor="cuisineType">Tipo de cozinha</Label>
          <Input id="cuisineType" {...register("cuisineType")} />
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Cores da loja</h2>
            <p className="text-sm text-muted-foreground">
              Personalize as cores exibidas em <span className="font-medium">/loja/{restaurant.slug}</span>. Isso não
              afeta o painel nem o modo escuro do sistema.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {THEME_PRESETS.map((preset) => (
            <Button key={preset.key} type="button" size="sm" variant="outline" onClick={() => applyPreset(preset.theme)}>
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Marca</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorField themeKey="primary" label="Cor principal" register={register} errors={errors} />
                <ColorField themeKey="secondary" label="Cor secundária" register={register} errors={errors} />
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Fundo</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorField themeKey="background" label="Fundo geral" register={register} errors={errors} />
                <ColorField themeKey="card" label="Cards" register={register} errors={errors} />
                <ColorField themeKey="header" label="Header / topo" register={register} errors={errors} />
                <ColorField themeKey="categoryBg" label="Menu de categorias" register={register} errors={errors} />
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Textos</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorField themeKey="text" label="Texto principal" register={register} errors={errors} />
                <ColorField themeKey="textMuted" label="Texto secundário" register={register} errors={errors} />
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Botões e destaques</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorField themeKey="button" label="Botão" register={register} errors={errors} />
                <ColorField themeKey="buttonText" label="Texto do botão" register={register} errors={errors} />
                <ColorField themeKey="price" label="Preços" register={register} errors={errors} />
                <ColorField themeKey="categoryActive" label="Categoria ativa" register={register} errors={errors} />
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Bordas</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorField themeKey="border" label="Bordas" register={register} errors={errors} />
              </div>
            </div>

            {contrastWarnings.length > 0 && (
              <div className="space-y-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                {contrastWarnings.map((warning) => (
                  <p key={warning} className="flex items-start gap-2">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                    {warning}
                  </p>
                ))}
              </div>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" disabled={restoring}>
                  {restoring ? "Restaurando..." : "Restaurar padrão"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Restaurar cores padrão?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso restaura apenas as cores da loja para o padrão do VSFood. Logo, banner, nome, descrição e
                    demais dados da loja não são alterados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRestoreDefault}>Restaurar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="lg:sticky lg:top-6">
            <p className="mb-2 text-sm font-semibold text-muted-foreground">Prévia</p>
            <StoreThemePreview theme={watchedTheme} storeName={watchedName} />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
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
      </section>

      <Button type="submit" disabled={loading || uploadingLogo || uploadingBanner}>
        {loading ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
