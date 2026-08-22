"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { createProductAction, updateProductAction } from "@/lib/actions/painel/menu";
import { uploadProductImage } from "@/lib/storage";
import { OptionGroupsEditor } from "./option-groups-editor";
import type { MenuCategory, MenuProduct } from "@/lib/data/menu";

export function ProductDialog({
  open,
  onOpenChange,
  restaurantId,
  categories,
  product,
  defaultCategoryId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  categories: MenuCategory[];
  product?: MenuProduct;
  defaultCategoryId?: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [promoPrice, setPromoPrice] = useState(product?.promo_price ? String(product.promo_price) : "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? defaultCategoryId ?? "");
  const [available, setAvailable] = useState(product?.available ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProductImage(restaurantId, file);
      setImageUrl(url);
    } catch {
      toast.error("Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Informe o nome do produto.");
      return;
    }
    const priceNumber = Number(price.replace(",", "."));
    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      toast.error("Informe um preço válido.");
      return;
    }

    setSaving(true);
    const input = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: priceNumber,
      promoPrice: promoPrice ? Number(promoPrice.replace(",", ".")) : null,
      categoryId: categoryId || null,
      imageUrl: imageUrl || null,
      available,
      featured,
    };

    const result = product ? await updateProductAction(product.id, input) : await createProductAction(input);
    setSaving(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Produto salvo.");
    router.refresh();
    if (!product) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted"
            >
              {uploading ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : imageUrl ? (
                <Image src={imageUrl} alt="" fill sizes="80px" className="object-cover" />
              ) : (
                <ImagePlus className="size-5 text-muted-foreground" />
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            <p className="text-xs text-muted-foreground">Clique para enviar uma foto do produto.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-name">Nome</Label>
            <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Descrição</Label>
            <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-price">Preço</Label>
              <Input id="p-price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-promo">Preço promocional</Label>
              <Input id="p-promo" value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
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

          <div className="flex items-center justify-between">
            <Label htmlFor="p-available">Disponível</Label>
            <Switch id="p-available" checked={available} onCheckedChange={setAvailable} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="p-featured">Destaque</Label>
            <Switch id="p-featured" checked={featured} onCheckedChange={setFeatured} />
          </div>

          <Button className="w-full" onClick={handleSave} disabled={saving || uploading}>
            {saving ? "Salvando..." : "Salvar produto"}
          </Button>

          {product && (
            <>
              <Separator />
              <OptionGroupsEditor productId={product.id} groups={product.optionGroups} />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
