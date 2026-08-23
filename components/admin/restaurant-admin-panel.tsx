"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrencyBRL, formatDateTime } from "@/lib/format";
import {
  deleteRestaurantAction,
  extendTrialAction,
  resetOwnerAccessAction,
  setAccessTypeAction,
  setTrialExpiryAction,
  updateOwnerEmailAction,
  updateRestaurantPlanAction,
  updateRestaurantStatusAction,
} from "@/lib/actions/admin/restaurants";
import { getAccessDescriptor } from "@/lib/restaurant-status";
import { RestaurantStatusBadge } from "@/components/shared/restaurant-status-badge";
import type { AdminRestaurantDetail } from "@/lib/data/admin";
import type { ActivePlanOption } from "@/lib/data/plans";
import type { AccessType, RestaurantStatus } from "@/types/database";

const STATUS_OPTIONS: { value: RestaurantStatus; label: string }[] = [
  { value: "trial", label: "Em teste" },
  { value: "active", label: "Ativo" },
  { value: "expired", label: "Expirado" },
  { value: "suspended", label: "Suspenso" },
];

const ACCESS_TYPE_OPTIONS: { value: AccessType; label: string }[] = [
  { value: "trial", label: "Teste grátis" },
  { value: "subscriber", label: "Assinante" },
  { value: "demo", label: "Demonstração" },
];

export function RestaurantAdminPanel({
  restaurant,
  plans,
}: {
  restaurant: AdminRestaurantDetail;
  plans: ActivePlanOption[];
}) {
  const router = useRouter();
  const [trialExpiresAt, setTrialExpiresAt] = useState(restaurant.trial_expires_at.slice(0, 10));
  const [newEmail, setNewEmail] = useState(restaurant.owner_email ?? "");
  const [loading, setLoading] = useState(false);

  function refresh() {
    router.refresh();
  }

  async function handleStatusChange(status: RestaurantStatus) {
    setLoading(true);
    const result = await updateRestaurantStatusAction(restaurant.id, status);
    setLoading(false);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Status atualizado.");
      refresh();
    }
  }

  async function handlePlanChange(planId: string) {
    setLoading(true);
    const result = await updateRestaurantPlanAction(restaurant.id, planId);
    setLoading(false);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Plano atualizado.");
      refresh();
    }
  }

  async function handleAccessTypeChange(accessType: AccessType) {
    setLoading(true);
    const result = await setAccessTypeAction(restaurant.id, accessType);
    setLoading(false);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Tipo de acesso atualizado.");
      refresh();
    }
  }

  async function handleExtend(days: number) {
    setLoading(true);
    const result = await extendTrialAction(restaurant.id, days);
    setLoading(false);
    if (result?.error) toast.error(result.error);
    else {
      toast.success(`Teste estendido em ${days} dias.`);
      refresh();
    }
  }

  async function handleSetExpiry() {
    setLoading(true);
    const result = await setTrialExpiryAction(restaurant.id, trialExpiresAt);
    setLoading(false);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Vencimento atualizado.");
      refresh();
    }
  }

  async function handleUpdateEmail() {
    if (!restaurant.owner_id) return;
    setLoading(true);
    const result = await updateOwnerEmailAction(restaurant.owner_id, restaurant.id, newEmail);
    setLoading(false);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("E-mail de acesso atualizado.");
      refresh();
    }
  }

  async function handleResetAccess() {
    if (!restaurant.owner_email) return;
    setLoading(true);
    await resetOwnerAccessAction(restaurant.owner_email);
    setLoading(false);
    toast.success("E-mail de redefinição de senha enviado.");
  }

  async function handleDelete() {
    setLoading(true);
    const result = await deleteRestaurantAction(restaurant.id);
    setLoading(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Loja excluída.");
    router.push("/admin/restaurantes");
  }

  const descriptor = getAccessDescriptor(restaurant, restaurant.plan_name);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{restaurant.name}</h1>
          <p className="text-sm text-muted-foreground">
            <Link href={`/loja/${restaurant.slug}`} className="hover:underline" target="_blank">
              /loja/{restaurant.slug}
            </Link>
          </p>
        </div>
        <RestaurantStatusBadge descriptor={descriptor} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-2xl font-bold">{restaurant.order_count}</p>
          <p className="text-sm text-muted-foreground">Pedidos</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-2xl font-bold">{formatCurrencyBRL(restaurant.revenue_total)}</p>
          <p className="text-sm text-muted-foreground">Faturamento total</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-2xl font-bold">{restaurant.owner_name ?? "—"}</p>
          <p className="text-sm text-muted-foreground">{restaurant.owner_email ?? "Sem responsável"}</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <h2 className="font-semibold">Tipo de acesso e plano</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Tipo de acesso</Label>
            <Select value={restaurant.access_type} onValueChange={(v) => handleAccessTypeChange(v as AccessType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCESS_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Plano atual</Label>
            <Select value={restaurant.plan_id ?? undefined} onValueChange={handlePlanChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar plano" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {restaurant.access_type !== "demo" && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={restaurant.status} onValueChange={(v) => handleStatusChange(v as RestaurantStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        {restaurant.access_type === "demo" && (
          <p className="mt-3 text-sm text-muted-foreground">
            Loja de demonstração: não expira, não é cobrada e não entra no MRR.
          </p>
        )}
      </div>

      {restaurant.access_type === "trial" && (
      <div className="rounded-2xl border bg-card p-5">
        <h2 className="font-semibold">Teste grátis</h2>
        <p className="mt-1 text-sm text-muted-foreground">Vence em {formatDateTime(restaurant.trial_expires_at)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExtend(7)} disabled={loading}>
            +7 dias
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExtend(15)} disabled={loading}>
            +15 dias
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExtend(30)} disabled={loading}>
            +30 dias
          </Button>
        </div>
        <div className="mt-3 flex items-end gap-2">
          <div className="space-y-1.5">
            <Label>Alterar vencimento</Label>
            <Input type="date" value={trialExpiresAt} onChange={(e) => setTrialExpiresAt(e.target.value)} />
          </div>
          <Button variant="outline" onClick={handleSetExpiry} disabled={loading}>
            Salvar
          </Button>
        </div>
      </div>
      )}

      <div className="rounded-2xl border bg-card p-5">
        <h2 className="font-semibold">Acesso do responsável</h2>
        <div className="mt-3 flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label>E-mail de acesso</Label>
            <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} disabled={!restaurant.owner_id} />
          </div>
          <Button variant="outline" onClick={handleUpdateEmail} disabled={loading || !restaurant.owner_id}>
            Alterar e-mail
          </Button>
        </div>
        <Button variant="outline" className="mt-3" onClick={handleResetAccess} disabled={loading || !restaurant.owner_email}>
          Redefinir acesso (enviar link de senha)
        </Button>
      </div>

      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
        <h2 className="font-semibold text-destructive">Zona de risco</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Excluir remove a loja permanentemente. Lojas com pedidos não podem ser excluídas — suspenda-as.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="mt-3" disabled={loading}>
              Excluir loja
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir {restaurant.name}?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
