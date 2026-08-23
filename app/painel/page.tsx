import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpenText,
  ClipboardList,
  DollarSign,
  ExternalLink,
  Palette,
  Receipt,
  ShoppingBag,
  Ticket,
} from "lucide-react";
import { requireRestaurantMembership } from "@/lib/auth";
import { getDashboardStats, getRestaurant, getPlanName } from "@/lib/data/painel";
import { formatCurrencyBRL } from "@/lib/format";
import { getAccessDescriptor } from "@/lib/restaurant-status";
import { RestaurantStatusBadge } from "@/components/shared/restaurant-status-badge";

export const metadata: Metadata = { title: "Dashboard" };

const shortcuts = [
  { href: "/painel/cardapio", label: "Cardápio", icon: BookOpenText },
  { href: "/painel/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/painel/aparencia", label: "Aparência", icon: Palette },
];

export default async function PainelDashboardPage() {
  const { restaurantId } = await requireRestaurantMembership();
  const [restaurant, stats] = await Promise.all([getRestaurant(restaurantId), getDashboardStats(restaurantId)]);
  if (!restaurant) notFound();
  const planName = await getPlanName(restaurant.plan_id);
  const descriptor = getAccessDescriptor(restaurant, planName);

  const cards = [
    { label: "Pedidos hoje", value: stats.ordersToday, icon: ShoppingBag },
    { label: "Faturamento hoje", value: formatCurrencyBRL(stats.revenueToday), icon: DollarSign },
    { label: "Ticket médio", value: formatCurrencyBRL(stats.averageTicket), icon: Receipt },
    { label: "Pedidos pendentes", value: stats.pendingOrders, icon: ClipboardList },
    { label: "Total de pedidos", value: stats.totalOrders, icon: Ticket },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{restaurant.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <RestaurantStatusBadge descriptor={descriptor} />
            {planName && <span className="text-sm text-muted-foreground">Plano {planName}</span>}
          </div>
        </div>
        <a
          href={`/loja/${restaurant.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ExternalLink className="size-4" />
          Ver loja
        </a>
      </div>

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

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {shortcuts.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center gap-2.5 rounded-2xl border bg-card p-4 text-sm font-medium transition-colors hover:border-primary/40"
          >
            <s.icon className="size-4 text-primary" />
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
