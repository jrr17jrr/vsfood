import type { DeliveryType, OrderStatus, PaymentStatus } from "@/types/database";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Novo",
  accepted: "Aceito",
  preparing: "Em preparo",
  out_for_delivery: "Saiu para entrega",
  ready_for_pickup: "Pronto para retirada",
  completed: "Finalizado",
  rejected: "Recusado",
  cancelled: "Cancelado",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pendente",
  approved: "Pago",
  rejected: "Recusado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

export function orderTimeline(deliveryType: DeliveryType): OrderStatus[] {
  return deliveryType === "delivery"
    ? ["new", "accepted", "preparing", "out_for_delivery", "completed"]
    : ["new", "accepted", "preparing", "ready_for_pickup", "completed"];
}

export function nextStatusOptions(current: OrderStatus, deliveryType: DeliveryType): OrderStatus[] {
  if (current === "new") return ["accepted", "rejected"];
  const timeline = orderTimeline(deliveryType);
  const index = timeline.indexOf(current);
  if (index === -1 || index === timeline.length - 1) return [];
  return [timeline[index + 1], "cancelled"];
}
