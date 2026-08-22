"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { formatCurrencyBRL } from "@/lib/format";
import {
  deleteCategoryAction,
  deleteProductAction,
  reorderCategoryAction,
  toggleProductAvailableAction,
  updateCategoryAction,
} from "@/lib/actions/painel/menu";
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

  async function handleToggleProduct(product: MenuProduct, available: boolean) {
    const result = await toggleProductAvailableAction(product.id, available);
    if (result?.error) toast.error(result.error);
    else onChange();
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

      <div className="divide-y">
        {category.products.map((product) => (
          <div key={product.id} className="flex items-center gap-3 p-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
              {product.image_url && <Image src={product.image_url} alt="" fill sizes="48px" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrencyBRL(product.promo_price ?? product.price)}
                {product.promo_price && <span className="ml-1 line-through">{formatCurrencyBRL(product.price)}</span>}
              </p>
            </div>
            <Switch checked={product.available} onCheckedChange={(v) => handleToggleProduct(product, v)} />
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
        ))}
      </div>

      <div className="p-3">
        <Button type="button" size="sm" variant="outline" onClick={() => onAddProduct(category.id)}>
          <Plus className="size-4" />
          Adicionar produto
        </Button>
      </div>
    </div>
  );
}
