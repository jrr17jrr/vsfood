import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getAdminRestaurants } from "@/lib/data/admin";
import { RestaurantsTable } from "@/components/admin/restaurants-table";

export const metadata: Metadata = { title: "Restaurantes" };

export default async function AdminRestaurantesPage() {
  await requireAdmin();
  const restaurants = await getAdminRestaurants();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Restaurantes</h1>
      <p className="mt-1 text-sm text-muted-foreground">{restaurants.length} lojas cadastradas na plataforma.</p>
      <div className="mt-6">
        <RestaurantsTable restaurants={restaurants} />
      </div>
    </div>
  );
}
