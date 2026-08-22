import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireCustomer } from "@/lib/auth";
import { getCustomerOrders } from "@/lib/data/account";
import { ProfileForm } from "@/components/account/profile-form";
import { formatCurrencyBRL, formatOrderNumber } from "@/lib/format";
import { ORDER_STATUS_LABEL } from "@/lib/orders/status";

export const metadata: Metadata = { title: "Meus dados" };

const ACTIVE_STATUSES = new Set(["new", "accepted", "preparing", "out_for_delivery", "ready_for_pickup"]);

export default async function MinhaContaPage() {
  const profile = await requireCustomer();
  const orders = await getCustomerOrders(profile.id);
  const activeOrder = orders.find((o) => ACTIVE_STATUSES.has(o.status));

  return (
    <div className="space-y-6">
      {activeOrder && (
        <Link
          href={`/pedido/${activeOrder.id}`}
          className="flex items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-4"
        >
          <div>
            <p className="text-sm font-medium text-primary">Pedido em andamento</p>
            <p className="text-sm text-muted-foreground">
              {activeOrder.restaurant_name} · {formatOrderNumber(activeOrder.number)} ·{" "}
              {ORDER_STATUS_LABEL[activeOrder.status]} · {formatCurrencyBRL(activeOrder.total)}
            </p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-primary" />
        </Link>
      )}

      <div>
        <h2 className="text-lg font-semibold">Dados pessoais</h2>
        <p className="mt-1 text-sm text-muted-foreground">Mantenha seus dados atualizados.</p>
        <div className="mt-4">
          <ProfileForm profile={profile} />
        </div>
      </div>
    </div>
  );
}
