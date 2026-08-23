import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stopAdminViewAction } from "@/lib/actions/admin/admin-view";

export function AdminViewBanner({ restaurantName }: { restaurantName: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground sm:px-6">
      <span className="flex items-center gap-2">
        <ShieldAlert className="size-4" />
        Modo Admin — {restaurantName}
      </span>
      <form action={stopAdminViewAction}>
        <Button type="submit" size="sm" variant="secondary">
          Voltar ao Painel DEV
        </Button>
      </form>
    </div>
  );
}
