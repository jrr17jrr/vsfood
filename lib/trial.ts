import type { Restaurant } from "@/types/database";

export function getTrialDaysLeft(restaurant: Pick<Restaurant, "status" | "trial_expires_at">): number | null {
  if (restaurant.status !== "trial") return null;
  return Math.max(0, Math.ceil((new Date(restaurant.trial_expires_at).getTime() - Date.now()) / 86_400_000));
}

export function formatTrialHeadline(template: string, days: number): string {
  return template.replace("{days}", String(days));
}
