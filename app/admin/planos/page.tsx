import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminPlans } from "@/lib/data/plans";
import { PlansTable } from "@/components/admin/plans-table";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Planos" };

export default async function AdminPlanosPage() {
  await requireAdmin();
  const plans = await getAdminPlans();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planos</h1>
          <p className="mt-1 text-sm text-muted-foreground">{plans.length} planos cadastrados na plataforma.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/planos/funcionalidades">Funcionalidades</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/planos/novo">
              <Plus className="size-4" />
              Novo plano
            </Link>
          </Button>
        </div>
      </div>
      <div className="mt-6">
        <PlansTable plans={plans} />
      </div>
    </div>
  );
}
