import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Criar conta" };

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const isRestaurant = tipo === "restaurante";

  return (
    <AuthShell
      title={isRestaurant ? "Cadastre seu restaurante" : "Criar conta"}
      description={
        isRestaurant
          ? "Crie sua conta grátis e comece a receber pedidos hoje mesmo."
          : "Crie sua conta para pedir nos restaurantes do VSFood."
      }
    >
      <SignUpForm intent={isRestaurant ? "restaurant_owner" : "customer"} />
    </AuthShell>
  );
}
