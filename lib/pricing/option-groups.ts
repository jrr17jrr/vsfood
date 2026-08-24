import type { OptionGroupPricingMode } from "@/types/database";

/**
 * Regras de cobrança de um grupo de opcionais e o cálculo do valor
 * efetivamente cobrado por cada opção selecionada — única fonte de verdade
 * usada tanto no preview do carrinho/modal (client) quanto no recálculo do
 * pedido no backend (lib/actions/orders.ts). Sem import "server-only": tem
 * que rodar dos dois lados.
 */

export type PricingGroup = {
  id: string;
  pricingMode: OptionGroupPricingMode;
  freeQuantity: number;
  fixedPrice: number;
};

export type PricingOption = {
  id: string;
  price: number;
};

export type OptionCharge = {
  optionId: string;
  /** Valor efetivamente cobrado por essa opção, já aplicando a regra do grupo — nunca o `price` bruto da opção. */
  charge: number;
};

/**
 * Calcula o valor cobrado por cada opção selecionada de um grupo.
 * `selectedOptions` deve estar na ordem em que o cliente selecionou — importa
 * para `free_first_n` (as N primeiras da lista ficam grátis).
 */
export function calculateGroupCharges(group: PricingGroup, selectedOptions: PricingOption[]): OptionCharge[] {
  if (selectedOptions.length === 0) return [];

  switch (group.pricingMode) {
    case "no_charge":
      return selectedOptions.map((o) => ({ optionId: o.id, charge: 0 }));

    case "per_option":
      return selectedOptions.map((o) => ({ optionId: o.id, charge: o.price }));

    case "free_first_n":
      return selectedOptions.map((o, index) => ({
        optionId: o.id,
        charge: index < group.freeQuantity ? 0 : o.price,
      }));

    case "highest_only": {
      const maxPrice = Math.max(...selectedOptions.map((o) => o.price));
      let alreadyCharged = false;
      return selectedOptions.map((o) => {
        if (!alreadyCharged && o.price === maxPrice) {
          alreadyCharged = true;
          return { optionId: o.id, charge: o.price };
        }
        return { optionId: o.id, charge: 0 };
      });
    }

    case "fixed_price":
      // Taxa única do grupo: atribuída à primeira opção selecionada pra não
      // contar o valor fixo mais de uma vez.
      return selectedOptions.map((o, index) => ({
        optionId: o.id,
        charge: index === 0 ? group.fixedPrice : 0,
      }));
  }
}

export function calculateGroupTotal(group: PricingGroup, selectedOptions: PricingOption[]): number {
  return calculateGroupCharges(group, selectedOptions).reduce((sum, c) => sum + c.charge, 0);
}

/** Soma o total de todos os grupos de um produto a partir das seleções feitas em cada grupo. */
export function calculateOptionGroupsTotal(groups: PricingGroup[], selectionsByGroup: Map<string, PricingOption[]>): number {
  let total = 0;
  for (const group of groups) {
    total += calculateGroupTotal(group, selectionsByGroup.get(group.id) ?? []);
  }
  return total;
}

/**
 * Texto automático da regra de seleção do grupo, no estilo de apps de
 * delivery ("Escolha 1 opção", "Escolha até 2 opções"...). Não descreve a
 * cobrança em si (isso é mostrado por opção) — só o comportamento de seleção.
 */
/**
 * Uma única frase já comunica seleção + obrigatoriedade (min=0 é sempre
 * opcional, min>=1 é sempre obrigatório) — não precisa de um selo separado.
 */
export function describeSelectionRule(group: { min_select: number; max_select: number }): string {
  const { min_select: min, max_select: max } = group;

  if (max === 1) return min >= 1 ? "Escolha 1 opção" : "Opcional";
  if (min <= 0) return `Escolha até ${max} opções`;
  if (min === max) return `Escolha ${min} opções`;
  return `Escolha de ${min} a ${max} opções`;
}

/** Texto sobre a cobrança do grupo, quando ela merece destaque (ex: "2 primeiras opções grátis"). */
export function describePricingRule(group: { pricing_mode: OptionGroupPricingMode; free_quantity: number; fixed_price: number }): string | null {
  switch (group.pricing_mode) {
    case "free_first_n":
      return group.free_quantity > 0
        ? `${group.free_quantity} primeira${group.free_quantity > 1 ? "s" : ""} opç${group.free_quantity > 1 ? "ões" : "ão"} grátis`
        : null;
    case "highest_only":
      return "Cobra apenas a opção mais cara";
    case "fixed_price":
      return "Taxa única para qualquer escolha";
    case "no_charge":
    case "per_option":
      return null;
  }
}
