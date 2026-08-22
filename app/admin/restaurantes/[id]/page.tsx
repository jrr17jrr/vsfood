import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAdminRestaurantDetail } from "@/lib/data/admin";
import { RestaurantAdminPanel } from "@/components/admin/restaurant-admin-panel";

export const metadata: Metadata = { title: "Restaurante" };

export default async function AdminRestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const restaurant = await getAdminRestaurantDetail(id);
  if (!restaurant) notFound();

  return <RestaurantAdminPanel restaurant={restaurant} />;
}
