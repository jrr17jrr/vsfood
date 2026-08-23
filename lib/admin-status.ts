import type { Restaurant, RestaurantStatus } from "@/types/database";

export type EffectiveStatus = RestaurantStatus | "trial_expired";

export function getEffectiveStatus(
  restaurant: Pick<Restaurant, "status" | "trial_expires_at"> & { is_demo?: boolean },
): EffectiveStatus {
  if (restaurant.is_demo) return "active";
  if (restaurant.status === "trial" && new Date(restaurant.trial_expires_at).getTime() < Date.now()) {
    return "trial_expired";
  }
  return restaurant.status;
}
