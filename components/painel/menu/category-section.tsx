"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Copy, PackageX, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { formatCurrencyBRL } from "@/lib/format";
import {
  deleteCategoryAction,
  deleteProductAction,
  duplicateCategoryAction,
  duplicateProductAction,
  markProductSoldOutAction,
  reorderCategoryAction,
  reorderProductsAction,
  toggleProductAvailableAction,
  updateCategoryAction,
} from "@/lib/actions/painel/menu";
import { SortableList } from "./sortable-list";
import { SortableItem } from "./sortable-item";
import type { MenuCategory, MenuProduct } from "@/lib/data/menu";

export function CategorySection({
  category,
  onChange,
  onEditProduct,
  onAddProduct,
}: {
  category: MenuCategory;
  onChange: () => void;
  onEditProduct: (product: MenuProduct) => void;
  onAddProduct: (categoryId: string) => void;
}) {
  const [name, setName] = useState(category.name);
  const [duplicating, setDuplicating] = useState(false);

  async function saveName() {
    if (name.trim() === category.name) return;
    const result = await updateCategoryAction(category.id, { name: name.trim() });
    if (result?.error) toast.error(result.error);
    else onChange();
  }

  async function handleToggleActive(active: boolean) {
    const result = await updateCategoryAction(category.id, { active });
    if (result?.error) toast.error(result.error);
    else onChange();
  }

  async function handleDelete() {
    const result = await deleteCategoryAction(category.id);
    if (result?.error) toast.error(result.error);
    else onChange();
  }

  async function handleReorder(direction: "up" | "down") {
    await reorderCategoryAction(category.id, direction);
    onChange();
  }

  async function handleReorderProducts(orderedIds: string[]) {
    await reorderProductsAction(category.id, orderedIds);
    onChange();
  }

  async function handleDuplicateCategory() {
    setDuplicating(true);
    const result = await duplicateCategoryAction(category.id);
    setDuplicating(false);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Categoria duplicada.");
      onChange();
    }
  }

  async function handleDuplicateProduct(productId: string) {
    const result = await duplicateProductAction(productId);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Produto duplicado.");
      onChange();
    }
  }

  async function handleToggleProduct(product: MenuProduct, available: boolean) {
    const result = await toggleProductAvailableAction(product.id, available);
    if (result?.error) toast.error(result.error);
    else onChange();
  }

  async function handleMarkSoldOut(productId: string) {
    const result = await markProductSoldOutAction(productId);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Produto marcado como esgotado.");
      onChange();
    }
  }

  async function handleDeleteProduct(productId: string) {
    const result = await deleteProductAction(productId);
    if (result?.error) toast.error(result.error);
    else onChange();
  }

  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex items-center gap-2 border-b p-3">
        <div className="flex flex-col">
          <button type="button" onClick={() => handleReorder("up")} className="text-muted-foreground hover:text-foreground">
            <ChevronUp className="size-3.5" />
          </button>
          <button type="button" onClick={() => handleReorder("down")} className="text-muted-foreground hover:text-foreground">
            <ChevronDown className="size-3.5" />
          </button>
        </div>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          className="h-8 max-w-56 border-none px-1 font-semibold shadow-none focus-visible:ring-1"
        />
        <span className="text-xs text-muted-foreground">{category.products.length} produtos</span>
        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Ativa
            <Switch checked={category.active} onCheckedChange={handleToggleActive} />
          </label>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDuplicateCategory}
            disabled={duplicating}
            aria-label="Duplicar categoria"
            title="Duplicar categoria"
          >
            <Copy className="size-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost">
                <Trash2 className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                <AlertDialogDescription>
                  Os produtos desta categoria não serão excluídos, mas ficarão sem categoria.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <SortableList items={category.products} onReorder={handleReorderProducts} className="divide-y">
        {(product) => {
          const soldOut = !product.unlimited_stock && product.stock_quantity <= 0;
          return (
            <SortableItem key={product.id} id={product.id} className="p-3">
              <div className="flex items-center gap-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <ImageWithFallback src={product.image_url} alt="" fill sizes="48px" className="object-cover" showLabel={false} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    {soldOut && <Badge variant="secondary">Esgotado</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrencyBRL(product.promo_price ?? product.price)}
                    {product.promo_price && <span className="ml-1 line-through">{formatCurrencyBRL(product.price)}</span>}
                  </p>
                </div>
                {!product.unlimited_stock && product.stock_quantity > 0 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleMarkSoldOut(product.id)}
                    aria-label="Marcar como esgotado"
                    title="Marcar como esgotado"
                  >
                    <PackageX className="size-4" />
                  </Button>
                )}
                <Switch checked={product.available} onCheckedChange={(v) => handleToggleProduct(product, v)} />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDuplicateProduct(product.id)}
                  aria-label="Duplicar produto"
                  title="Duplicar produto"
                >
                  <Copy className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onEditProduct(product)}>
                  <Pencil className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </SortableItem>
          );
        }}
      </SortableList>

      <div className="p-3">
        <Button type="button" size="sm" variant="outline" onClick={() => onAddProduct(category.id)}>
          <Plus className="size-4" />
          Adicionar produto
        </Button>
      </div>
    </div>
  );
}
