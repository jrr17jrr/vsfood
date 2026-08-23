"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fixOwnerAccessAction } from "@/lib/actions/admin/restaurants";
import type { AccessDiagnostics } from "@/lib/data/admin-diagnostics";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function AccessDiagnosticsCard({
  restaurantId,
  diagnostics,
}: {
  restaurantId: string;
  diagnostics: AccessDiagnostics;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(diagnostics.ownerEmail ?? "");
  const [loading, setLoading] = useState(false);

  async function handleFix() {
    setLoading(true);
    const result = await fixOwnerAccessAction(restaurantId, diagnostics.ownerProfileId ? { ownerId: diagnostics.ownerProfileId } : { email });
    setLoading(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Acesso corrigido.");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2">
        {diagnostics.isConsistent ? (
          <CheckCircle2 className="size-4 text-primary" />
        ) : (
          <AlertTriangle className="size-4 text-destructive" />
        )}
        <h2 className="font-semibold">Diagnóstico de acesso</h2>
      </div>

      <div className="mt-3 space-y-1.5">
        <Row label="ID do usuário" value={diagnostics.ownerProfileId ?? "—"} />
        <Row label="E-mail" value={diagnostics.ownerEmail ?? "—"} />
        <Row label="Role em profiles" value={diagnostics.profileRole ?? "—"} />
        <Row label="Restaurante vinculado" value={diagnostics.membershipRestaurantId ? "Esta loja" : "Nenhum"} />
        <Row label="Role em restaurant_users" value={diagnostics.membershipRole ?? "—"} />
        <Row label="Auth user encontrado" value={diagnostics.authUserFound ? "Sim" : "Não"} />
        <Row label="Status" value={diagnostics.isConsistent ? "OK" : "Inconsistente"} />
      </div>

      {!diagnostics.isConsistent && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm font-medium text-destructive">Problemas encontrados</p>
          <ul className="mt-1 list-inside list-disc text-sm text-destructive">
            {diagnostics.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>

          {!diagnostics.ownerProfileId && (
            <div className="mt-3 space-y-1.5">
              <Label htmlFor="fix-email">E-mail do responsável (pra localizar a conta)</Label>
              <Input id="fix-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          )}

          <Button
            variant="outline"
            className="mt-3"
            onClick={handleFix}
            disabled={loading || (!diagnostics.ownerProfileId && !email.trim())}
          >
            {loading ? "Corrigindo..." : "Corrigir acesso do responsável"}
          </Button>
        </div>
      )}
    </div>
  );
}
