import { z } from "zod";

export const trialSettingsSchema = z.object({
  isActive: z.boolean(),
  defaultDays: z.number().int().min(0, "Dias inválidos"),
  defaultPlanId: z.string().uuid("Selecione um plano"),
  headlineTemplate: z.string().trim().min(1, "Informe o texto"),
});
export type TrialSettingsInput = z.infer<typeof trialSettingsSchema>;
