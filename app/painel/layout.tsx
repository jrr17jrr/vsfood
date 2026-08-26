import { notFound } from "next/navigation";
import { requireRestaurantMembership } from "@/lib/auth";
import { getRestaurant, getPlanName, getNewOrdersCount } from "@/lib/data/painel";
import { PainelSidebar, PainelMobileNav } from "@/components/painel/painel-sidebar";
import { StoreStatusBar } from "@/components/painel/store-status-bar";
import { AdminViewBanner } from "@/components/painel/admin-view-banner";
import { OrdersRealtimeNotifier } from "@/components/painel/orders-realtime-notifier";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const { restaurantId, isAdminView } = await requireRestaurantMembership();
  const restaurant = await getRestaurant(restaurantId);
  if (!restaurant) notFound();
  const [planName, newOrdersCount] = await Promise.all([
    getPlanName(restaurant.plan_id),
    getNewOrdersCount(restaurantId),
  ]);

  return (
    <div className="flex min-h-screen">
      <OrdersRealtimeNotifier restaurantId={restaurantId} />
      <div className="print:hidden contents">
        <PainelSidebar restaurantName={restaurant.name} newOrdersCount={newOrdersCount} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="print:hidden contents">
          <PainelMobileNav restaurantName={restaurant.name} newOrdersCount={newOrdersCount} />
          {isAdminView && <AdminViewBanner restaurantName={restaurant.name} />}
          <StoreStatusBar restaurant={restaurant} planName={planName} />
        </div>
        <main className="flex-1 bg-secondary/20 p-4 sm:p-6 print:p-0">{children}</main>
      </div>
    </div>
  );
}
