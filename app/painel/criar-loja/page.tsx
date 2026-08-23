import { redirect } from "next/navigation";

/**
 * Auto-cadastro de restaurante desativado — a criação de loja é só pelo
 * admin (/admin/restaurantes/novo). Esta rota é herdada de app/painel/layout.tsx,
 * que já resolveu a loja certa (do dono, ou a que o admin está visualizando
 * via Modo Admin) antes de chegar aqui — então sempre é seguro mandar pra
 * /painel. Mantida (em vez de removida) só pra não quebrar links antigos.
 */
export default function CriarLojaPage() {
  redirect("/painel");
}
