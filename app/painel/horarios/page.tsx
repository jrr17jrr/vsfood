import type { Metadata } from "next";
import { requireRestaurantMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { HoursManager } from "@/components/painel/hours-manager";

export const metadata: Metadata = { title: "Horários" };

export default async function HorariosPage() {
  const { restaurantId } = await requireRestaurantMembership();
  const supabase = await createClient();
  const { data: openingHours } = await supabase.from("opening_hours").select("*").eq("restaurant_id", restaurantId);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Horários de funcionamento</h1>
      <p className="mt-1 text-sm text-muted-foreground">Configure os horários por dia da semana. Você pode adicionar mais de um período por dia.</p>
      <div className="mt-6 max-w-xl">
        <HoursManager openingHours={openingHours ?? []} />
      </div>
    </div>
  );
}
