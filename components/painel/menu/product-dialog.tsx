"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createProductAction, updateProductAction } from "@/lib/actions/painel/menu";
import { uploadProductImage } from "@/lib/storage";
import { ProductBasicInfo } from "./product-basic-info";
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
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b px-4 py-3.5 sm:px-6">
          <DialogTitle>{product ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-8">
            <ProductBasicInfo
              name={name}
              onNameChange={setName}
              description={description}
              onDescriptionChange={setDescription}
              price={price}
              onPriceChange={setPrice}
              promoPrice={promoPrice}
              onPromoPriceChange={setPromoPrice}
              categoryId={categoryId}
              onCategoryIdChange={setCategoryId}
              categories={categories}
              available={available}
              onAvailableChange={setAvailable}
              featured={featured}
              onFeaturedChange={setFeatured}
              imageUrl={imageUrl}
              uploading={uploading}
              onImageClick={() => fileInputRef.current?.click()}
              fileInputRef={fileInputRef}
              onImageChange={handleImageChange}
            />

            {product ? (
              <OptionGroupsEditor productId={product.id} groups={product.optionGroups} />
            ) : (
              <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Salve o produto para poder configurar os grupos de adicionais.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 flex-row items-center justify-end gap-2 rounded-t-none border-t px-4 py-3 sm:px-6">
          <Button type="button" variant="outline" className="shrink-0" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || uploading} className="flex-1 sm:min-w-44 sm:flex-none">
            {saving ? "Salvando..." : "Salvar produto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
