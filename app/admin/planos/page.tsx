import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminPlans } from "@/lib/data/plans";
import { getAdminTrialSettings } from "@/lib/data/trial-settings";
import { formatTrialHeadline } from "@/lib/trial";
import { PlansTable } from "@/components/admin/plans-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Planos" };

export default async function AdminPlanosPage() {
  await requireAdmin();
  const [plans, trial] = await Promise.all([getAdminPlans(), getAdminTrialSettings()]);

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

      <div className="mt-8 rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">Teste grátis</h2>
              <Badge variant={trial.is_active ? "default" : "secondary"} className={trial.is_active ? "bg-primary" : ""}>
                {trial.is_active ? "Ativo" : "Desativado"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Tipo de acesso, não é um plano — só define os padrões usados ao criar uma loja em teste.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/planos/teste-gratis">Configurar teste grátis</Link>
          </Button>
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Dias padrão</dt>
            <dd className="font-medium">{trial.default_days}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Plano padrão</dt>
            <dd className="font-medium">{trial.defaultPlanName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Texto na página de venda</dt>
            <dd className="font-medium">{formatTrialHeadline(trial.headline_template, trial.default_days)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
