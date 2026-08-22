import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefrontData } from "@/lib/data/storefront";
import { getOpenStatus } from "@/lib/opening-hours";
import { StoreHeader } from "@/components/store/store-header";
import { CategoryNav } from "@/components/store/category-nav";
import { ProductCatalog } from "@/components/store/product-catalog";
import { CartWidget } from "@/components/cart/cart-widget";
import { CartRestaurantSync } from "@/components/store/cart-restaurant-sync";
import { StoreFooter } from "@/components/layout/public-footer";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getStorefrontData(slug);
  if (!data) return { title: "Loja não encontrada" };

  const title = `${data.restaurant.name} | Peça online pelo VSFood`;
  const description =
    data.restaurant.description ?? `Peça online no ${data.restaurant.name} pelo VSFood: cardápio, PIX e cartão.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: data.restaurant.banner_url ? [data.restaurant.banner_url] : undefined,
    },
  };
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  const data = await getStorefrontData(slug);
  if (!data) notFound();

  const { restaurant, categories, openingHours, deliveryZones } = data;
  const openStatus = getOpenStatus(openingHours);
  const minDeliveryFee = deliveryZones.length > 0 ? Math.min(...deliveryZones.map((z) => z.fee)) : null;

  return (
    <>
      <CartRestaurantSync restaurantId={restaurant.id} slug={restaurant.slug} />
      <main className="flex-1 pb-24 sm:pb-10">
        <StoreHeader restaurant={restaurant} openStatus={openStatus} minDeliveryFee={minDeliveryFee} />
        <CategoryNav categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
        {categories.length === 0 ? (
          <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted-foreground">
            <p className="font-medium text-foreground">Cardápio em breve</p>
            <p className="mt-1 text-sm">Esta loja ainda está preparando seu cardápio.</p>
          </div>
        ) : (
          <ProductCatalog categories={categories} />
        )}
      </main>
      <CartWidget minOrderValue={restaurant.min_order_value} />
      <StoreFooter restaurantName={restaurant.name} />
    </>
  );
}
