import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { CreateRestaurantForm } from "@/components/painel/create-restaurant-form";

export const metadata: Metadata = { title: "Criar minha loja" };

export default async function CriarLojaPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "restaurant_owner" && profile.role !== "admin") redirect("/");

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("restaurant_users")
    .select("restaurant_id")
    .eq("user_id", profile.id)
    .limit(1)
    .maybeSingle();

  if (membership) redirect("/painel");

  return (
    <AuthShell title="Crie sua loja" description="Falta pouco para você começar a receber pedidos.">
      <CreateRestaurantForm />
    </AuthShell>
  );
}
