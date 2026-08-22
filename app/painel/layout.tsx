import { notFound } from "next/navigation";
import { requireRestaurantMembership } from "@/lib/auth";
import { getRestaurant } from "@/lib/data/painel";
import { getTrialDaysLeft } from "@/lib/trial";
import { PainelSidebar, PainelMobileNav } from "@/components/painel/painel-sidebar";
import { StoreStatusBar } from "@/components/painel/store-status-bar";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const { restaurantId } = await requireRestaurantMembership();
  const restaurant = await getRestaurant(restaurantId);
  if (!restaurant) notFound();

  return (
    <div className="flex min-h-screen">
      <PainelSidebar restaurantName={restaurant.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <PainelMobileNav restaurantName={restaurant.name} />
        <StoreStatusBar restaurant={restaurant} trialDaysLeft={getTrialDaysLeft(restaurant)} />
        <main className="flex-1 bg-secondary/20 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
