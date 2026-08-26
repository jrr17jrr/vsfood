import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRestaurantMembership } from "@/lib/auth";
import { getRestaurant, getPainelOrderDetail } from "@/lib/data/painel";
import { ComandaPrintView } from "@/components/painel/print/comanda-print-view";

export const metadata: Metadata = { title: "Comanda" };

export default async function ImprimirPedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { restaurantId } = await requireRestaurantMembership();
  const restaurant = await getRestaurant(restaurantId);
  if (!restaurant) notFound();

  const order = await getPainelOrderDetail(restaurantId, id);
  if (!order) notFound();

  return <ComandaPrintView order={order} restaurant={restaurant} />;
}
