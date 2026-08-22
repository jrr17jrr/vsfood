"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRestaurantMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const hoursSchema = z.array(
  z.object({
    weekday: z.number().int().min(0).max(6),
    opensAt: z.string().regex(/^\d{2}:\d{2}$/),
    closesAt: z.string().regex(/^\d{2}:\d{2}$/),
  }),
);
export type OpeningHoursInput = z.infer<typeof hoursSchema>;

export async function saveOpeningHoursAction(input: OpeningHoursInput): Promise<{ error?: string }> {
  const { restaurantId } = await requireRestaurantMembership();
  const parsed = hoursSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createClient();
  await supabase.from("opening_hours").delete().eq("restaurant_id", restaurantId);

  if (parsed.data.length > 0) {
    const { error } = await supabase.from("opening_hours").insert(
      parsed.data.map((h) => ({
        restaurant_id: restaurantId,
        weekday: h.weekday,
        opens_at: h.opensAt,
        closes_at: h.closesAt,
      })),
    );
    if (error) return { error: "Não foi possível salvar os horários." };
  }

  revalidatePath("/painel/horarios");
  revalidatePath("/loja", "layout");
  return {};
}
