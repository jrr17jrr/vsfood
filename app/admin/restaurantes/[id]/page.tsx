import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAdminRestaurantDetail } from "@/lib/data/admin";
import { getActivePlansForForm } from "@/lib/data/plans";
import { getAccessDiagnostics } from "@/lib/data/admin-diagnostics";
import { RestaurantAdminPanel } from "@/components/admin/restaurant-admin-panel";

export const metadata: Metadata = { title: "Restaurante" };

export default async function AdminRestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [restaurant, plans] = await Promise.all([getAdminRestaurantDetail(id), getActivePlansForForm()]);
  if (!restaurant) notFound();

  const diagnostics = await getAccessDiagnostics(id, restaurant.owner_id);

  return <RestaurantAdminPanel restaurant={restaurant} plans={plans} diagnostics={diagnostics} />;
}
