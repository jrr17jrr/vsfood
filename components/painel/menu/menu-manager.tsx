"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookOpenText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCategoryAction } from "@/lib/actions/painel/menu";
import { CategorySection } from "./category-section";
import { ProductDialog } from "./product-dialog";
import type { MenuCategory, MenuProduct } from "@/lib/data/menu";

export function MenuManager({ restaurantId, categories }: { restaurantId: string; categories: MenuCategory[] }) {
  const router = useRouter();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [dialogState, setDialogState] = useState<{ productId?: string; categoryId?: string } | null>(null);

  const editingProduct: MenuProduct | undefined = dialogState?.productId
    ? categories.flatMap((c) => c.products).find((p) => p.id === dialogState.productId)
    : undefined;

  function refresh() {
    router.refresh();
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    const result = await createCategoryAction({ name: newCategoryName.trim() });
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setNewCategoryName("");
    refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Nova categoria (ex: Bebidas)"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="max-w-xs"
        />
        <Button type="button" variant="outline" onClick={handleAddCategory}>
          <Plus className="size-4" />
          Nova categoria
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
          <BookOpenText className="size-8" />
          <p className="font-medium text-foreground">Seu cardápio está vazio</p>
          <p className="text-sm">Crie sua primeira categoria para começar a cadastrar produtos.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {categories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              onChange={refresh}
              onEditProduct={(product) => setDialogState({ productId: product.id })}
              onAddProduct={(categoryId) => setDialogState({ categoryId })}
            />
          ))}
        </div>
      )}

      {dialogState && (
        <ProductDialog
          open
          onOpenChange={(open) => !open && setDialogState(null)}
          restaurantId={restaurantId}
          categories={categories}
          product={editingProduct}
          defaultCategoryId={dialogState.categoryId}
        />
      )}
    </div>
  );
}
