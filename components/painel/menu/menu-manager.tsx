"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookOpenText, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCategoryAction, reorderCategoriesAction } from "@/lib/actions/painel/menu";
import { CategorySection } from "./category-section";
import { ProductDialog } from "./product-dialog";
import { SortableList } from "./sortable-list";
import { SortableItem } from "./sortable-item";
import type { MenuCategory, MenuProduct } from "@/lib/data/menu";

export function MenuManager({ restaurantId, categories }: { restaurantId: string; categories: MenuCategory[] }) {
  const router = useRouter();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [search, setSearch] = useState("");
  const [dialogState, setDialogState] = useState<{ productId?: string; categoryId?: string } | null>(null);

  const editingProduct: MenuProduct | undefined = dialogState?.productId
    ? categories.flatMap((c) => c.products).find((p) => p.id === dialogState.productId)
    : undefined;

  // Busca instantânea, sem request: os dados já vieram do server (`categories`
  // prop) — só filtra em memória por nome de produto ou de categoria,
  // case-insensitive. Categoria some da lista quando nenhum produto dela
  // bate na busca e o nome da própria categoria também não bate.
  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories;
    return categories
      .map((category) => {
        const categoryMatches = category.name.toLowerCase().includes(term);
        if (categoryMatches) return category;
        const products = category.products.filter((p) => p.name.toLowerCase().includes(term));
        return products.length > 0 ? { ...category, products } : null;
      })
      .filter((c): c is MenuCategory => c !== null);
  }, [categories, search]);

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

  async function handleReorderCategories(orderedIds: string[]) {
    await reorderCategoriesAction(orderedIds);
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

      {categories.length > 0 && (
        <div className="relative mt-4 max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {categories.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
          <BookOpenText className="size-8" />
          <p className="font-medium text-foreground">Seu cardápio está vazio</p>
          <p className="text-sm">Crie sua primeira categoria para começar a cadastrar produtos.</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          Nenhum produto encontrado.
        </div>
      ) : search.trim() ? (
        // Com busca ativa a ordem não é o que o dono definiu (é resultado de
        // filtro), então não faz sentido habilitar arrastar-e-soltar aqui —
        // exibe a lista filtrada sem SortableList/handle.
        <div className="mt-6 space-y-4">
          {filteredCategories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              onChange={refresh}
              onEditProduct={(product) => setDialogState({ productId: product.id })}
              onAddProduct={(categoryId) => setDialogState({ categoryId })}
            />
          ))}
        </div>
      ) : (
        <SortableList items={categories} onReorder={handleReorderCategories} className="mt-6 space-y-4">
          {(category) => (
            <SortableItem key={category.id} id={category.id} handleClassName="mt-4 ml-1">
              <CategorySection
                category={category}
                onChange={refresh}
                onEditProduct={(product) => setDialogState({ productId: product.id })}
                onAddProduct={(categoryId) => setDialogState({ categoryId })}
              />
            </SortableItem>
          )}
        </SortableList>
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
