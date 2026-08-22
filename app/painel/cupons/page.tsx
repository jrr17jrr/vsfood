import type { Metadata } from "next";
import { requireRestaurantMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CouponsManager } from "@/components/painel/coupons-manager";

export const metadata: Metadata = { title: "Cupons" };

export default async function CuponsPage() {
  const { restaurantId } = await requireRestaurantMembership();
  const supabase = await createClient();
  const { data: coupons } = await supabase
    .from("coupons")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Cupons</h1>
      <div className="mt-6">
        <CouponsManager coupons={coupons ?? []} />
      </div>
    </div>
  );
}
