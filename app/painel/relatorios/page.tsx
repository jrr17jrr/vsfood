import type { Metadata } from "next";
import { requireRestaurantMembership } from "@/lib/auth";
import { getReportStats } from "@/lib/data/reports";
import { formatCurrencyBRL } from "@/lib/format";

export const metadata: Metadata = { title: "Relatórios" };

export default async function RelatoriosPage() {
  const { restaurantId } = await requireRestaurantMembership();
  const stats = await getReportStats(restaurantId);

  const cards = [
    { label: "Pedidos hoje", value: stats.ordersToday },
    { label: "Pedidos na semana", value: stats.ordersWeek },
    { label: "Pedidos no mês", value: stats.ordersMonth },
    { label: "Faturamento hoje", value: formatCurrencyBRL(stats.revenueToday) },
    { label: "Faturamento no mês", value: formatCurrencyBRL(stats.revenueMonth) },
    { label: "Ticket médio (mês)", value: formatCurrencyBRL(stats.averageTicketMonth) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
      <p className="mt-1 text-sm text-muted-foreground">Últimos 30 dias.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border bg-card p-5">
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border bg-card p-5">
        <h2 className="font-semibold">Produtos mais vendidos</h2>
        {stats.topProducts.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Ainda não há pedidos suficientes.</p>
        ) : (
          <div className="mt-3 divide-y">
            {stats.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                  {p.name}
                </span>
                <span className="text-muted-foreground">
                  {p.quantity}x · {formatCurrencyBRL(p.revenue)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
