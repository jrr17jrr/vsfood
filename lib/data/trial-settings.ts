import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { TrialSettings } from "@/types/database";

const FALLBACK: Omit<TrialSettings, "id" | "created_at" | "updated_at"> = {
  is_active: true,
  default_days: 7,
  default_plan_id: null,
  headline_template: "Teste grátis por {days} dias",
};

export async function getTrialSettings(): Promise<TrialSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trial_settings")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (data) return data;
  return { id: "", created_at: "", updated_at: "", ...FALLBACK };
}

export type AdminTrialSettings = TrialSettings & { defaultPlanName: string | null };

export async function getAdminTrialSettings(): Promise<AdminTrialSettings> {
  const settings = await getTrialSettings();
  if (!settings.default_plan_id) return { ...settings, defaultPlanName: null };

  const supabase = await createClient();
  const { data: plan } = await supabase.from("plans").select("name").eq("id", settings.default_plan_id).maybeSingle();
  return { ...settings, defaultPlanName: plan?.name ?? null };
}
