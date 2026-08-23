"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { trialSettingsSchema, type TrialSettingsInput } from "@/lib/validations/trial-settings";

type Result = { error?: string };

export async function updateTrialSettingsAction(input: TrialSettingsInput): Promise<Result> {
  await requireAdmin();
  const parsed = trialSettingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const row = {
    is_active: parsed.data.isActive,
    default_days: parsed.data.defaultDays,
    default_plan_id: parsed.data.defaultPlanId,
    headline_template: parsed.data.headlineTemplate,
  };

  const { data: existing } = await supabase.from("trial_settings").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();

  const { error } = existing
    ? await supabase.from("trial_settings").update(row).eq("id", existing.id)
    : await supabase.from("trial_settings").insert(row);

  if (error) return { error: "Não foi possível salvar a configuração do teste grátis." };

  revalidatePath("/admin/planos");
  revalidatePath("/admin/planos/teste-gratis");
  revalidatePath("/");
  return {};
}
