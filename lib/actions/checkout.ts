"use server";

import { getConnectionStatus } from "@/lib/mercadopago/connection";

export async function getPaymentCapabilitiesAction(
  restaurantId: string,
): Promise<{ onlineAvailable: boolean; publicKey: string | null }> {
  const status = await getConnectionStatus(restaurantId);
  return { onlineAvailable: status.connected, publicKey: status.publicKey };
}
