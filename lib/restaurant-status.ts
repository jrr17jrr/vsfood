import type { Restaurant } from "@/types/database";
import { getTrialDaysLeft } from "@/lib/trial";
import { getEffectiveStatus } from "@/lib/admin-status";

export type AccessDescriptor =
  | { kind: "demo" }
  | { kind: "trial"; daysLeft: number; expired: boolean }
  | { kind: "subscriber"; status: "active" | "suspended" | "expired"; planName: string | null };

type RestaurantForStatus = Pick<Restaurant, "status" | "trial_expires_at" | "access_type" | "is_demo">;

export function getAccessDescriptor(restaurant: RestaurantForStatus, planName: string | null): AccessDescriptor {
  if (restaurant.is_demo) return { kind: "demo" };

  if (restaurant.access_type === "trial") {
    const effective = getEffectiveStatus(restaurant);
    return { kind: "trial", daysLeft: getTrialDaysLeft(restaurant) ?? 0, expired: effective === "trial_expired" };
  }

  const status = restaurant.status === "trial" ? "active" : restaurant.status;
  return { kind: "subscriber", status, planName };
}

export function accessDescriptorLabel(descriptor: AccessDescriptor): string {
  switch (descriptor.kind) {
    case "demo":
      return "Demonstração";
    case "trial":
      return descriptor.expired ? "Teste expirado" : `Teste grátis — ${descriptor.daysLeft} dia${descriptor.daysLeft === 1 ? "" : "s"} restantes`;
    case "subscriber": {
      const plan = descriptor.planName ?? "sem plano";
      if (descriptor.status === "active") return `Plano ${plan} — Ativo`;
      if (descriptor.status === "suspended") return "Assinatura suspensa";
      return `Plano ${plan} — Expirado`;
    }
  }
}
