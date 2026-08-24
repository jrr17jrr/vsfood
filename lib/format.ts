export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatOrderNumber(number: number): string {
  return `#${number.toString().padStart(4, "0")}`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatWhatsappDisplay(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return value;
}

export type OptionSummaryEntry = { groupName: string; optionName: string; price: number };

/**
 * Agrupa opções escolhidas por nome de grupo pra exibição em carrinho/pedido,
 * ex: ["Ponto da carne: Ao ponto", "Adicionais: Bacon extra (+ R$ 5,00), Cheddar extra"].
 * Preserva a ordem de primeira aparição de cada grupo.
 */
export function formatOptionGroupsSummary(options: OptionSummaryEntry[]): string[] {
  const order: string[] = [];
  const byGroup = new Map<string, OptionSummaryEntry[]>();
  for (const o of options) {
    if (!byGroup.has(o.groupName)) order.push(o.groupName);
    const list = byGroup.get(o.groupName) ?? [];
    list.push(o);
    byGroup.set(o.groupName, list);
  }
  return order.map((groupName) => {
    const parts = (byGroup.get(groupName) ?? []).map((o) =>
      o.price > 0 ? `${o.optionName} (+${formatCurrencyBRL(o.price)})` : o.optionName,
    );
    return `${groupName}: ${parts.join(", ")}`;
  });
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
