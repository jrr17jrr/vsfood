"use client";

import type { RefObject } from "react";
import { ImagePlus, Loader2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import type { MenuCategory } from "@/lib/data/menu";

/**
 * Coluna "Informações do produto" do modal de edição — sem estado próprio,
 * tudo controlado pelo ProductDialog (mesmos handlers/actions de sempre).
 */
export function ProductBasicInfo({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  price,
  onPriceChange,
  promoPrice,
  onPromoPriceChange,
  categoryId,
  onCategoryIdChange,
  categories,
  available,
  onAvailableChange,
  featured,
  onFeaturedChange,
  imageUrl,
  uploading,
  onImageClick,
  fileInputRef,
  onImageChange,
}: {
  name: string;
  onNameChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  price: string;
  onPriceChange: (v: string) => void;
  promoPrice: string;
  onPromoPriceChange: (v: string) => void;
  categoryId: string;
  onCategoryIdChange: (v: string) => void;
  categories: MenuCategory[];
  available: boolean;
  onAvailableChange: (v: boolean) => void;
  featured: boolean;
  onFeaturedChange: (v: boolean) => void;
  imageUrl: string;
  uploading: boolean;
  onImageClick: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="min-w-0 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Informações do produto</h3>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onImageClick}
          className="relative size-24 shrink-0 overflow-hidden rounded-2xl border bg-muted"
        >
          {uploading ? (
            <div className="grid size-full place-items-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : imageUrl ? (
            <ImageWithFallback src={imageUrl} alt="" fill sizes="96px" className="object-cover" showLabel={false} />
          ) : (
            <div className="grid size-full place-items-center">
              <ImagePlus className="size-6 text-muted-foreground" />
            </div>
          )}
          <span className="absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm">
            <Pencil className="size-3.5" />
          </span>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onImageChange} />
        <p className="text-xs text-muted-foreground">Clique na foto para enviar uma nova imagem.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-name">Nome</Label>
        <Input id="p-name" value={name} onChange={(e) => onNameChange(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-desc">Descrição</Label>
        <Textarea id="p-desc" value={description} onChange={(e) => onDescriptionChange(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="p-price">Preço</Label>
          <Input id="p-price" value={price} onChange={(e) => onPriceChange(e.target.value)} placeholder="0,00" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-promo">Preço promocional</Label>
          <Input id="p-promo" value={promoPrice} onChange={(e) => onPromoPriceChange(e.target.value)} placeholder="Opcional" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Categoria</Label>
        <Select value={categoryId} onValueChange={onCategoryIdChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="p-available" className="text-sm font-normal">
            Disponível
          </Label>
          <Switch id="p-available" checked={available} onCheckedChange={onAvailableChange} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="p-featured" className="text-sm font-normal">
            Destaque
          </Label>
          <Switch id="p-featured" checked={featured} onCheckedChange={onFeaturedChange} />
        </div>
      </div>
    </div>
  );
}
