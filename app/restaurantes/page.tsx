import type { Metadata } from "next";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { MarketplaceGrid } from "@/components/store/marketplace-grid";
import { getMarketplaceRestaurants } from "@/lib/data/marketplace";

export const metadata: Metadata = {
  title: "Restaurantes",
  description: "Encontre restaurantes, lanchonetes e delivery perto de você no VSFood.",
};

export default async function RestaurantesPage() {
  const restaurants = await getMarketplaceRestaurants();

  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-3xl font-bold tracking-tight">Restaurantes</h1>
          <p className="mt-2 text-muted-foreground">Descubra e peça nos restaurantes parceiros do VSFood.</p>

          <div className="mt-8">
            <MarketplaceGrid restaurants={restaurants} />
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
