import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Checa se o plano atual do restaurante inclui a feature (via
 * plan_feature_links). Único ponto de verdade pra gate de features por
 * plano — hoje usado só pra pagamento online, mas serve pra qualquer feature
 * futura sem duplicar a consulta. Usa service role (mesmo padrão de
 * lib/mercadopago/connection.ts) pra não depender de RLS/sessão de quem chama.
 */
export async function restaurantHasFeature(restaurantId: string, featureKey: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("plan_id")
    .eq("id", restaurantId)
    .maybeSingle();
  if (!restaurant?.plan_id) return false;

  const { data: feature } = await supabase.from("plan_features").select("id").eq("key", featureKey).maybeSingle();
  if (!feature) return false;

  const { data: link } = await supabase
    .from("plan_feature_links")
    .select("plan_id")
    .eq("plan_id", restaurant.plan_id)
    .eq("feature_id", feature.id)
    .maybeSingle();

  return link != null;
}
