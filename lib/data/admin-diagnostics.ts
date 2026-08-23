import "server-only";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export type AccessDiagnostics = {
  ownerProfileId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  profileRole: string | null;
  membershipRestaurantId: string | null;
  membershipRole: string | null;
  authUserFound: boolean;
  isConsistent: boolean;
  issues: string[];
};

/**
 * Traça a cadeia inteira auth.users → profiles → restaurant_users pro
 * responsável desta loja, pra diagnosticar por que um dono não consegue
 * acessar /painel sem precisar de acesso direto ao banco. `ownerId` vem do
 * mesmo lookup que `getAdminRestaurantDetail` já faz (restaurant_users onde
 * role = owner) — se vier `null`, o vínculo já está ausente.
 */
export async function getAccessDiagnostics(restaurantId: string, ownerId: string | null): Promise<AccessDiagnostics> {
  if (!ownerId) {
    return {
      ownerProfileId: null,
      ownerName: null,
      ownerEmail: null,
      profileRole: null,
      membershipRestaurantId: null,
      membershipRole: null,
      authUserFound: false,
      isConsistent: false,
      issues: ["Nenhum vínculo em restaurant_users (role owner) encontrado para esta loja."],
    };
  }

  const supabase = await createClient();
  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("id, name, email, role").eq("id", ownerId).maybeSingle(),
    supabase.from("restaurant_users").select("restaurant_id, role").eq("user_id", ownerId).eq("restaurant_id", restaurantId).maybeSingle(),
  ]);

  const db = createServiceRoleClient();
  const { data: authUserData } = await db.auth.admin.getUserById(ownerId);
  const authUserFound = !!authUserData?.user;

  const issues: string[] = [];
  if (!profile) issues.push("Não existe profiles para este user_id — a conta pode ter sido removida.");
  if (profile && profile.role !== "restaurant_owner") {
    issues.push(`profiles.role está "${profile.role}", deveria ser "restaurant_owner".`);
  }
  if (!membership) {
    issues.push("restaurant_users não tem vínculo entre este usuário e esta loja específica.");
  } else if (membership.role !== "owner") {
    issues.push(`restaurant_users.role está "${membership.role}", deveria ser "owner".`);
  }
  if (!authUserFound) issues.push("Usuário não encontrado em auth.users (Supabase Auth) — a conta pode ter sido deletada.");

  return {
    ownerProfileId: ownerId,
    ownerName: profile?.name ?? null,
    ownerEmail: profile?.email ?? authUserData?.user?.email ?? null,
    profileRole: profile?.role ?? null,
    membershipRestaurantId: membership?.restaurant_id ?? null,
    membershipRole: membership?.role ?? null,
    authUserFound,
    isConsistent: issues.length === 0,
    issues,
  };
}
