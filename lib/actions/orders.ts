"use server";

import { randomUUID } from "node:crypto";
import { requireCustomer } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createOrderSchema, type CreateOrderInput } from "@/lib/validations/checkout";
import { evaluateCoupon, matchDeliveryFee, roundCurrency } from "@/lib/orders/pricing";
import { calculateGroupCharges } from "@/lib/pricing/option-groups";
import { getOpenStatus } from "@/lib/opening-hours";
import { getValidAccessToken } from "@/lib/mercadopago/connection";
import { getRestaurantConfig } from "@/lib/mercadopago/client";
import { createCardPayment, createPixPayment, mapMpStatusToPaymentStatus } from "@/lib/mercadopago/payments";
import type { AddressSnapshot, PaymentStatus } from "@/types/database";

type CreateOrderResult =
  | { orderId: string; orderNumber: number; paymentStatus: PaymentStatus; paymentError?: string }
  | { error: string };

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function createOrderAction(input: CreateOrderInput): Promise<CreateOrderResult> {
  const profile = await requireCustomer();

  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const data = parsed.data;

  const db = createServiceRoleClient();

  const { data: restaurant } = await db.from("restaurants").select("*").eq("id", data.restaurantId).maybeSingle();
  if (!restaurant) return { error: "Restaurante não encontrado." };
  if (restaurant.status === "suspended") return { error: "Esta loja está indisponível no momento." };
  if (restaurant.orders_paused) return { error: "Esta loja pausou os pedidos no momento." };

  const { data: hours } = await db.from("opening_hours").select("*").eq("restaurant_id", restaurant.id);
  if (!getOpenStatus(hours ?? []).isOpen) return { error: "Esta loja está fechada no momento." };

  const isOnlinePayment = data.paymentMethod === "pix_online" || data.paymentMethod === "card_online";
  let restaurantAccessToken: string | null = null;

  if (isOnlinePayment) {
    restaurantAccessToken = await getValidAccessToken(restaurant.id);
    if (!restaurantAccessToken) return { error: "Este restaurante ainda não aceita pagamento online." };
    if (data.paymentMethod === "card_online" && !data.card) {
      return { error: "Dados do cartão ausentes." };
    }
  }

  // --- valida itens e recalcula preços a partir do banco (nunca confia no total do client) ---
  const productIds = [...new Set(data.items.map((i) => i.productId))];
  const { data: products } = await db
    .from("products")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .in("id", productIds);

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  const { data: groups } = await db.from("product_option_groups").select("*").in("product_id", productIds);
  const groupMap = new Map((groups ?? []).map((g) => [g.id, g]));

  const groupIds = (groups ?? []).map((g) => g.id);
  const { data: options } = groupIds.length
    ? await db.from("product_options").select("*").in("group_id", groupIds)
    : { data: [] };
  const optionMap = new Map((options ?? []).map((o) => [o.id, o]));

  type ResolvedItem = {
    productId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    notes: string;
    subtotal: number;
    options: { groupName: string; optionName: string; price: number }[];
  };

  const resolvedItems: ResolvedItem[] = [];

  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product || !product.available) return { error: "Um dos produtos não está mais disponível." };

    const productGroups = (groups ?? []).filter((g) => g.product_id === product.id);
    const selectedByGroup = new Map<string, string[]>();
    for (const sel of item.optionIds) {
      const group = groupMap.get(sel.groupId);
      const option = optionMap.get(sel.optionId);
      if (!group || group.product_id !== product.id) return { error: "Adicional inválido." };
      if (!option || option.group_id !== group.id || !option.available) {
        return { error: "Um dos adicionais não está mais disponível." };
      }
      const list = selectedByGroup.get(group.id) ?? [];
      list.push(option.id);
      selectedByGroup.set(group.id, list);
    }

    for (const group of productGroups) {
      const count = (selectedByGroup.get(group.id) ?? []).length;
      if (group.required && count < Math.max(group.min_select, 1)) {
        return { error: `Selecione uma opção em "${group.name}" (${product.name}).` };
      }
      if (count < group.min_select) {
        return { error: `Selecione ao menos ${group.min_select} opções em "${group.name}" (${product.name}).` };
      }
      if (count > group.max_select) {
        return { error: `Selecione no máximo ${group.max_select} opções em "${group.name}" (${product.name}).` };
      }
    }

    const basePrice = product.promo_price ?? product.price;

    // Nunca confia no `price` que o client mandou — recalcula a cobrança de
    // cada opção a partir da regra real do grupo (banco), preservando a
    // ordem de seleção enviada (importa pra free_first_n: as N primeiras da
    // lista ficam grátis).
    const resolvedOptions = productGroups.flatMap((group) => {
      const selectedIds = selectedByGroup.get(group.id) ?? [];
      const selectedOpts = selectedIds.map((id) => {
        const option = optionMap.get(id)!;
        return { id: option.id, price: option.price };
      });
      const charges = calculateGroupCharges(
        { id: group.id, pricingMode: group.pricing_mode, freeQuantity: group.free_quantity, fixedPrice: group.fixed_price },
        selectedOpts,
      );
      return charges.map((c) => {
        const option = optionMap.get(c.optionId)!;
        return { groupName: group.name, optionName: option.name, price: c.charge };
      });
    });
    const optionsTotal = resolvedOptions.reduce((sum, o) => sum + o.price, 0);
    const lineSubtotal = roundCurrency((basePrice + optionsTotal) * item.quantity);

    resolvedItems.push({
      productId: product.id,
      name: product.name,
      unitPrice: basePrice,
      quantity: item.quantity,
      notes: item.notes ?? "",
      subtotal: lineSubtotal,
      options: resolvedOptions,
    });
  }

  const subtotal = roundCurrency(resolvedItems.reduce((sum, i) => sum + i.subtotal, 0));

  if (subtotal < restaurant.min_order_value) {
    return { error: `Pedido mínimo: R$ ${restaurant.min_order_value.toFixed(2)}.` };
  }

  // --- entrega / retirada ---
  let addressSnapshot: AddressSnapshot | null = null;
  let deliveryFee = 0;

  if (data.deliveryType === "delivery") {
    let address: AddressSnapshot & { id?: string };

    if (data.addressId) {
      const { data: existing } = await db
        .from("customer_addresses")
        .select("*")
        .eq("id", data.addressId)
        .eq("user_id", profile.id)
        .maybeSingle();
      if (!existing) return { error: "Endereço não encontrado." };
      address = existing;
    } else if (data.newAddress) {
      const { data: created, error } = await db
        .from("customer_addresses")
        .insert({ ...data.newAddress, user_id: profile.id })
        .select("*")
        .single();
      if (error || !created) return { error: "Não foi possível salvar o endereço." };
      address = created;
    } else {
      return { error: "Informe o endereço de entrega." };
    }

    const { data: zones } = await db
      .from("delivery_zones")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .eq("active", true);

    const fee = matchDeliveryFee(zones ?? [], address.neighborhood);
    if (fee === null) return { error: "Não entregamos nesse bairro." };
    deliveryFee = fee;

    addressSnapshot = {
      cep: address.cep,
      street: address.street,
      number: address.number,
      complement: address.complement,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      reference: address.reference,
    };
  }

  // --- cupom ---
  let discount = 0;
  let couponId: string | null = null;

  if (data.couponCode) {
    const { data: coupon } = await db
      .from("coupons")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .ilike("code", data.couponCode.trim())
      .maybeSingle();

    const evaluation = evaluateCoupon(coupon, subtotal);
    if ("error" in evaluation) return { error: evaluation.error };
    discount = roundCurrency(evaluation.discount);
    couponId = coupon!.id;
  }

  const total = roundCurrency(Math.max(0, subtotal - discount + deliveryFee));

  const changeFor = data.paymentMethod === "cash" && data.needsChange ? (data.changeFor ?? null) : null;
  if (data.paymentMethod === "cash" && data.needsChange && (changeFor === null || changeFor < total)) {
    return { error: "Informe um valor de troco válido." };
  }

  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({
      restaurant_id: restaurant.id,
      customer_id: profile.id,
      status: "new",
      payment_status: "pending",
      payment_method: data.paymentMethod,
      delivery_type: data.deliveryType,
      address_snapshot: addressSnapshot,
      subtotal,
      discount,
      delivery_fee: deliveryFee,
      total,
      coupon_id: couponId,
      notes: data.notes ?? null,
      change_for: changeFor,
    })
    .select("id, number")
    .single();

  if (orderError || !order) return { error: "Não foi possível criar o pedido. Tente novamente." };

  const { data: insertedItems, error: itemsError } = await db
    .from("order_items")
    .insert(
      resolvedItems.map((i) => ({
        order_id: order.id,
        product_id: i.productId,
        name_snapshot: i.name,
        price_snapshot: i.unitPrice,
        quantity: i.quantity,
        notes: i.notes || null,
        subtotal: i.subtotal,
      })),
    )
    .select("id, product_id");

  if (itemsError || !insertedItems) return { error: "Não foi possível registrar os itens do pedido." };

  const optionRows = insertedItems.flatMap((inserted) => {
    const original = resolvedItems.find((i) => i.productId === inserted.product_id);
    if (!original) return [];
    return original.options.map((o) => ({
      order_item_id: inserted.id,
      group_name_snapshot: o.groupName,
      option_name_snapshot: o.optionName,
      price_snapshot: o.price,
    }));
  });

  if (optionRows.length > 0) {
    await db.from("order_item_options").insert(optionRows);
  }

  if (couponId) {
    await db.from("coupon_usages").insert({ coupon_id: couponId, order_id: order.id, user_id: profile.id });
    const { data: currentCoupon } = await db.from("coupons").select("used_count").eq("id", couponId).single();
    if (currentCoupon) {
      await db.from("coupons").update({ used_count: currentCoupon.used_count + 1 }).eq("id", couponId);
    }
  }

  if (!isOnlinePayment || !restaurantAccessToken) {
    return { orderId: order.id, orderNumber: order.number, paymentStatus: "pending" };
  }

  // --- pagamento online (PIX ou cartão) via Mercado Pago, com a conta do restaurante ---
  const idempotencyKey = randomUUID();
  const { data: paymentRow } = await db
    .from("payments")
    .insert({
      restaurant_id: restaurant.id,
      order_id: order.id,
      provider: "mercadopago",
      method: data.paymentMethod,
      status: "pending",
      amount: total,
      idempotency_key: idempotencyKey,
    })
    .select("id")
    .single();

  const config = getRestaurantConfig(restaurantAccessToken);
  const notificationUrl = `${appUrl()}/api/webhooks/mercadopago`;

  try {
    const mpPayment =
      data.paymentMethod === "pix_online"
        ? await createPixPayment({
            config,
            amount: total,
            description: `Pedido ${restaurant.name} #${order.number}`,
            payerEmail: profile.email ?? `cliente-${profile.id}@vsfood.com.br`,
            externalReference: order.id,
            notificationUrl,
            idempotencyKey,
          })
        : await createCardPayment({
            config,
            amount: total,
            description: `Pedido ${restaurant.name} #${order.number}`,
            token: data.card!.token,
            installments: data.card!.installments,
            paymentMethodId: data.card!.paymentMethodId,
            issuerId: data.card!.issuerId,
            payerEmail: profile.email ?? `cliente-${profile.id}@vsfood.com.br`,
            externalReference: order.id,
            notificationUrl,
            idempotencyKey,
          });

    const paymentStatus = mapMpStatusToPaymentStatus(mpPayment.status);

    if (paymentRow) {
      await db
        .from("payments")
        .update({
          provider_payment_id: mpPayment.id ? String(mpPayment.id) : null,
          status: paymentStatus,
          raw_payload: mpPayment as unknown as Record<string, unknown>,
        })
        .eq("id", paymentRow.id);
    }
    await db.from("orders").update({ payment_status: paymentStatus }).eq("id", order.id);

    if (paymentStatus === "rejected") {
      return {
        orderId: order.id,
        orderNumber: order.number,
        paymentStatus,
        paymentError: `Pagamento recusado (${mpPayment.status_detail ?? "tente novamente"}).`,
      };
    }

    return { orderId: order.id, orderNumber: order.number, paymentStatus };
  } catch {
    if (paymentRow) {
      await db.from("payments").update({ status: "rejected" }).eq("id", paymentRow.id);
    }
    await db.from("orders").update({ payment_status: "rejected" }).eq("id", order.id);
    return {
      orderId: order.id,
      orderNumber: order.number,
      paymentStatus: "rejected",
      paymentError: "Não foi possível processar o pagamento. Tente novamente.",
    };
  }
}
