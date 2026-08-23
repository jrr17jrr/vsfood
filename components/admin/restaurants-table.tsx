"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/lib/format";
import { getEffectiveStatus, type EffectiveStatus } from "@/lib/admin-status";
import { getAccessDescriptor } from "@/lib/restaurant-status";
import { RestaurantStatusBadge } from "@/components/shared/restaurant-status-badge";
import type { AdminRestaurantListItem } from "@/lib/data/admin";
import type { AccessType } from "@/types/database";

const STATUS_FILTER_LABEL: Record<EffectiveStatus, string> = {
  trial: "Em teste",
  trial_expired: "Teste vencido",
  active: "Ativo",
  expired: "Expirado",
  suspended: "Suspenso",
};

const ACCESS_TYPE_FILTER_LABEL: Record<AccessType, string> = {
  trial: "Teste grátis",
  subscriber: "Assinante",
  demo: "Demonstração",
};

const ALL = "__all__";

export function RestaurantsTable({ restaurants }: { restaurants: AdminRestaurantListItem[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [planFilter, setPlanFilter] = useState(ALL);
  const [accessTypeFilter, setAccessTypeFilter] = useState(ALL);

  const planOptions = useMemo(() => {
    const names = new Set(restaurants.map((r) => r.plan_name).filter((n): n is string => !!n));
    return [...names].sort();
  }, [restaurants]);

  const filtered = restaurants.filter((r) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.slug.toLowerCase().includes(q) ||
      (r.owner_name?.toLowerCase().includes(q) ?? false) ||
      (r.owner_email?.toLowerCase().includes(q) ?? false);
    if (!matchesQuery) return false;

    if (statusFilter !== ALL && getEffectiveStatus(r) !== statusFilter) return false;
    if (planFilter !== ALL && r.plan_name !== planFilter) return false;
    if (accessTypeFilter !== ALL && r.access_type !== accessTypeFilter) return false;

    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1 min-w-[220px]">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar loja ou responsável..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os status</SelectItem>
            {Object.entries(STATUS_FILTER_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={accessTypeFilter} onValueChange={setAccessTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tipo de acesso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os acessos</SelectItem>
            {Object.entries(ACCESS_TYPE_FILTER_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {planOptions.length > 0 && (
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os planos</SelectItem>
              {planOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {filtered.map((r) => {
          const descriptor = getAccessDescriptor(r, r.plan_name);
          return (
            <Link
              key={r.id}
              href={`/admin/restaurantes/${r.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{r.name}</p>
                  <RestaurantStatusBadge descriptor={descriptor} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {r.owner_name ?? "Sem responsável"} {r.owner_email ? `· ${r.owner_email}` : ""}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>{r.plan_name ?? "Sem plano"}</p>
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
