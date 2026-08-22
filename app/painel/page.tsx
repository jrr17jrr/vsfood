import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, DollarSign, Receipt, ShoppingBag, Ticket } from "lucide-react";
import { requireRestaurantMembership } from "@/lib/auth";
import { getDashboardStats } from "@/lib/data/painel";
import { formatCurrencyBRL } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

export default async function PainelDashboardPage() {
  const { restaurantId } = await requireRestaurantMembership();
  const stats = await getDashboardStats(restaurantId);

  const cards = [
    { label: "Pedidos hoje", value: stats.ordersToday, icon: ShoppingBag },
    { label: "Faturamento hoje", value: formatCurrencyBRL(stats.revenueToday), icon: DollarSign },
    { label: "Ticket médio", value: formatCurrencyBRL(stats.averageTicket), icon: Receipt },
    { label: "Pedidos pendentes", value: stats.pendingOrders, icon: ClipboardList },
    { label: "Total de pedidos", value: stats.totalOrders, icon: Ticket },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Visão geral da sua loja.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border bg-card p-5">
            <card.icon className="size-5 text-primary" />
            <p className="mt-3 text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      {stats.pendingOrders > 0 && (
        <Link
          href="/painel/pedidos"
          className="mt-6 flex items-center justify-between rounded-2xl border border-primary/40 bg-primary/5 p-4"
        >
          <p className="text-sm font-medium text-primary">
            Você tem {stats.pendingOrders} {stats.pendingOrders === 1 ? "pedido novo" : "pedidos novos"} aguardando
          </p>
          <span className="text-sm font-semibold text-primary">Ver pedidos →</span>
        </Link>
      )}
    </div>
  );
}
