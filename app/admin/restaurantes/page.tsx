import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminRestaurants } from "@/lib/data/admin";
import { RestaurantsTable } from "@/components/admin/restaurants-table";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Restaurantes" };

export default async function AdminRestaurantesPage() {
  await requireAdmin();
  const restaurants = await getAdminRestaurants();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Restaurantes</h1>
          <p className="mt-1 text-sm text-muted-foreground">{restaurants.length} lojas cadastradas na plataforma.</p>
        </div>
        <Button asChild>
          <Link href="/admin/restaurantes/novo">
            <Plus className="size-4" />
            Criar restaurante
          </Link>
        </Button>
      </div>
      <div className="mt-6">
        <RestaurantsTable restaurants={restaurants} />
      </div>
    </div>
  );
}
