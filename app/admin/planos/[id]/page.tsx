import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getPlanDetail, getAllPlanFeatures } from "@/lib/data/plans";
import { PlanForm } from "@/components/admin/plan-form";

export const metadata: Metadata = { title: "Editar plano" };

export default async function AdminEditarPlanoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [plan, allFeatures] = await Promise.all([getPlanDetail(id), getAllPlanFeatures()]);
  if (!plan) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Editar plano</h1>
      <div className="mt-6">
        <PlanForm plan={plan} allFeatures={allFeatures} />
      </div>
    </div>
  );
}
