import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getActivePlansForForm } from "@/lib/data/plans";
import { CreateRestaurantAdminForm } from "@/components/admin/create-restaurant-admin-form";

export const metadata: Metadata = { title: "Criar restaurante" };

export default async function AdminNovoRestaurantePage() {
  await requireAdmin();
  const plans = await getActivePlansForForm();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Criar restaurante</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Cria o acesso do responsável e a loja de uma vez. O dono entra normalmente em /login.
      </p>
      <div className="mt-6">
        <CreateRestaurantAdminForm plans={plans} />
      </div>
    </div>
  );
}
