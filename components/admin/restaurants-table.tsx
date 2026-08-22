"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { getEffectiveStatus, type EffectiveStatus } from "@/lib/admin-status";
import type { AdminRestaurantListItem } from "@/lib/data/admin";

const STATUS_LABEL: Record<EffectiveStatus, string> = {
  trial: "Em teste",
  trial_expired: "Teste vencido",
  active: "Ativo",
  expired: "Expirado",
  suspended: "Suspenso",
};

const STATUS_VARIANT: Record<EffectiveStatus, "default" | "secondary" | "destructive"> = {
  trial: "secondary",
  trial_expired: "destructive",
  active: "default",
  expired: "destructive",
  suspended: "destructive",
};

export function RestaurantsTable({ restaurants }: { restaurants: AdminRestaurantListItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = restaurants.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      r.slug.toLowerCase().includes(q) ||
      (r.owner_name?.toLowerCase().includes(q) ?? false) ||
      (r.owner_email?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div>
      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar loja ou responsável..." className="pl-9" />
      </div>

      <div className="mt-4 space-y-2">
        {filtered.map((r) => {
          const effective = getEffectiveStatus(r);
          return (
            <Link
              key={r.id}
              href={`/admin/restaurantes/${r.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{r.name}</p>
                  <Badge variant={STATUS_VARIANT[effective]} className={cn(effective === "active" && "bg-primary")}>
                    {STATUS_LABEL[effective]}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {r.owner_name ?? "Sem responsável"} {r.owner_email ? `· ${r.owner_email}` : ""}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Plano {r.plan}</p>
                <p>{r.order_count} pedidos</p>
                <p>Cadastro {formatDateTime(r.created_at)}</p>
              </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">Nenhum restaurante encontrado.</p>
        )}
      </div>
    </div>
  );
}
