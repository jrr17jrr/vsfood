import type { DeliveryType, OrderStatus, PaymentMethod, PaymentStatus, PrintStatus } from "@/types/database";

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

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  pix_online: "PIX (online)",
  card_online: "Cartão (online)",
  pix_manual: "PIX manual",
  cash: "Dinheiro",
  card_on_delivery: "Cartão na entrega",
};

export const PRINT_STATUS_LABEL: Record<PrintStatus, string> = {
  pending: "Aguardando impressão",
  processing: "Imprimindo",
  printed: "Impresso",
  failed: "Falha na impressão",
};

/** Só mostra o badge de impressão quando fizer sentido: a loja realmente usa
 * impressão automática, ou o pedido já teve alguma atividade de impressão
 * real (fora do estado padrão "pending"). Evita mostrar "Aguardando
 * impressão" em todo pedido pra sempre enquanto não existe VSFood Print. */
export function shouldShowPrintBadge(printStatus: PrintStatus, autoPrintEnabled: boolean): boolean {
  return autoPrintEnabled || printStatus !== "pending";
}

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
