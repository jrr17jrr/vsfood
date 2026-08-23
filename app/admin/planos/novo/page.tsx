import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getAllPlanFeatures } from "@/lib/data/plans";
import { PlanForm } from "@/components/admin/plan-form";

export const metadata: Metadata = { title: "Novo plano" };

export default async function AdminNovoPlanoPage() {
  await requireAdmin();
  const allFeatures = await getAllPlanFeatures();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Novo plano</h1>
      <div className="mt-6">
        <PlanForm plan={null} allFeatures={allFeatures} />
      </div>
    </div>
  );
}
