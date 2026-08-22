import type { Metadata } from "next";
import { requireRestaurantMembership } from "@/lib/auth";
import { getMenuData } from "@/lib/data/menu";
import { MenuManager } from "@/components/painel/menu/menu-manager";

export const metadata: Metadata = { title: "Cardápio" };

export default async function CardapioPage() {
  const { restaurantId } = await requireRestaurantMembership();
  const categories = await getMenuData(restaurantId);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Cardápio</h1>
      <p className="mt-1 text-sm text-muted-foreground">Categorias, produtos e adicionais da sua loja.</p>
      <div className="mt-6">
        <MenuManager restaurantId={restaurantId} categories={categories} />
      </div>
    </div>
  );
}
