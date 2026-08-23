import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getAdminTrialSettings } from "@/lib/data/trial-settings";
import { getActivePlansForForm } from "@/lib/data/plans";
import { TrialSettingsForm } from "@/components/admin/trial-settings-form";

export const metadata: Metadata = { title: "Configurar teste grátis" };

export default async function AdminTrialSettingsPage() {
  await requireAdmin();
  const [settings, plans] = await Promise.all([getAdminTrialSettings(), getActivePlansForForm()]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Configurar teste grátis</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Teste grátis é um tipo de acesso, não um plano. Isso só define os valores padrão usados
        ao criar uma nova loja e o texto mostrado na página de venda.
      </p>
      <div className="mt-6">
        <TrialSettingsForm settings={settings} plans={plans} />
      </div>
    </div>
  );
}
