"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Pencil } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatCurrencyBRL } from "@/lib/format";
import { togglePlanActiveAction, duplicatePlanAction } from "@/lib/actions/admin/plans";
import type { AdminPlanListItem } from "@/lib/data/plans";

export function PlansTable({ plans }: { plans: AdminPlanListItem[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleToggle(id: string, isActive: boolean) {
    setLoadingId(id);
    const result = await togglePlanActiveAction(id, isActive);
    setLoadingId(null);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function handleDuplicate(id: string) {
    setLoadingId(id);
    const result = await duplicatePlanAction(id);
    setLoadingId(null);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Plano duplicado como inativo.");
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plano</TableHead>
            <TableHead>Mensal</TableHead>
            <TableHead>Anual</TableHead>
            <TableHead>Restaurantes</TableHead>
            <TableHead>Ordem</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{p.name}</span>
                  {p.is_featured && <Badge className="bg-primary">Mais escolhido</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{p.code}</p>
              </TableCell>
              <TableCell>{p.price_monthly !== null ? formatCurrencyBRL(p.price_monthly) : "Em breve"}</TableCell>
              <TableCell>{p.price_yearly !== null ? formatCurrencyBRL(p.price_yearly) : "—"}</TableCell>
              <TableCell>{p.restaurant_count}</TableCell>
              <TableCell>{p.display_order}</TableCell>
              <TableCell>
                <label className="flex items-center gap-2">
                  <Switch
                    checked={p.is_active}
                    disabled={loadingId === p.id}
                    onCheckedChange={(checked) => handleToggle(p.id, checked)}
                  />
                  <span className="text-xs text-muted-foreground">{p.is_active ? "Ativo" : "Inativo"}</span>
                </label>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button asChild variant="ghost" size="icon-sm">
                    <Link href={`/admin/planos/${p.id}`} aria-label="Editar plano">
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Duplicar plano"
                    disabled={loadingId === p.id}
                    onClick={() => handleDuplicate(p.id)}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {plans.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nenhum plano cadastrado.</p>}
    </div>
  );
}
