import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getAllPlanFeatures } from "@/lib/data/plans";
import { PlanFeaturesManager } from "@/components/admin/plan-features-manager";

export const metadata: Metadata = { title: "Funcionalidades dos planos" };

export default async function AdminPlanFeaturesPage() {
  await requireAdmin();
  const features = await getAllPlanFeatures();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Funcionalidades dos planos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Lista global de funcionalidades. Vincule cada uma aos planos na tela de edição do plano.
      </p>
      <div className="mt-6">
        <PlanFeaturesManager features={features} />
      </div>
    </div>
  );
}
