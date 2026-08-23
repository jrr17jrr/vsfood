import type { Metadata } from "next";
import { Store, CheckCircle2, Clock, AlertTriangle, Ban, Sparkles, UserPlus, ShoppingBag, DollarSign } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminDashboardStats } from "@/lib/data/admin";
import { formatCurrencyBRL } from "@/lib/format";

export const metadata: Metadata = { title: "Painel DEV" };

export default async function AdminDashboardPage() {
  await requireAdmin();
  const stats = await getAdminDashboardStats();

  const cards = [
    { label: "Total de restaurantes", value: stats.total, icon: Store },
    { label: "Ativos", value: stats.active, icon: CheckCircle2 },
    { label: "Em teste", value: stats.trial, icon: Clock },
    { label: "Teste vencido", value: stats.trialExpired, icon: AlertTriangle },
    { label: "Suspensos", value: stats.suspended, icon: Ban },
    { label: "Demonstração", value: stats.demo, icon: Sparkles },
    { label: "Novos (últimos 30 dias)", value: stats.newLast30Days, icon: UserPlus },
    { label: "Testes vencendo (≤3 dias)", value: stats.trialEndingSoon, icon: AlertTriangle },
    { label: "Total de pedidos", value: stats.totalOrders, icon: ShoppingBag },
    { label: "MRR", value: formatCurrencyBRL(stats.mrr), icon: DollarSign },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Painel DEV</h1>
      <p className="mt-1 text-sm text-muted-foreground">Visão geral da plataforma VSFood.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border bg-card p-5">
            <card.icon className="size-5 text-primary" />
            <p className="mt-3 text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      {stats.subscribersByPlan.length > 0 && (
        <div className="mt-6 rounded-2xl border bg-card p-5">
          <h2 className="font-semibold">Assinantes por plano</h2>
          <div className="mt-3 space-y-2">
            {stats.subscribersByPlan.map((row) => (
              <div key={row.planName} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{row.planName}</span>
                <span className="font-medium">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
