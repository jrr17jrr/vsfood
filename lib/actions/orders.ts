"use server";

import { randomUUID } from "node:crypto";
import { requireCustomer } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createOrderSchema, type CreateOrderInput } from "@/lib/validations/checkout";
import { applyFreeShipping, evaluateCoupon, roundCurrency } from "@/lib/orders/pricing";
import { resolveDeliveryQuote } from "@/lib/orders/delivery-pricing";
import { resolveOrderItems } from "@/lib/orders/resolve-items";
import { geocodeAddress } from "@/lib/geocoding/nominatim";
import { getOpenStatus } from "@/lib/opening-hours";
import { getValidAccessToken } from "@/lib/mercadopago/connection";
import { getRestaurantConfig } from "@/lib/mercadopago/client";
import { createCardPayment, createPixPayment, mapMpStatusToPaymentStatus } from "@/lib/mercadopago/payments";
import { restaurantHasFeature } from "@/lib/plans/features";
import type { AddressSnapshot, CustomerAddress, PaymentStatus } from "@/types/database";

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

  // Nunca confia no método escolhido no client — o restaurante pode ter
  // desabilitado entrega ou retirada depois que a página carregou.
  if (data.deliveryType === "delivery" && !restaurant.delivery_enabled) {
    return { error: "Esta loja não está aceitando pedidos para entrega no momento." };
  }
  if (data.deliveryType === "pickup" && !restaurant.pickup_enabled) {
    return { error: "Esta loja não está aceitando pedidos para retirada no momento." };
  }

  const isOnlinePayment = data.paymentMethod === "pix_online" || data.paymentMethod === "card_online";
  let restaurantAccessToken: string | null = null;

  if (isOnlinePayment) {
    if (!(await restaurantHasFeature(restaurant.id, "online_payment"))) {
      return { error: "Pagamento online disponível apenas no plano Pro." };
    }
    restaurantAccessToken = await getValidAccessToken(restaurant.id);
    if (!restaurantAccessToken) return { error: "Este restaurante ainda não aceita pagamento online." };
    if (data.paymentMethod === "card_online" && !data.card) {
      return { error: "Dados do cartão ausentes." };
    }
  }

  // --- valida itens e recalcula preços a partir do banco (nunca confia no total do client) ---
  const resolution = await resolveOrderItems(db, restaurant.id, data.items);
  if ("error" in resolution) return { error: resolution.error };
  const { resolvedItems, subtotal, productMap } = resolution;

  // --- entrega / retirada ---
  // Recalcula tudo a partir do banco (zona, frete grátis, pedido mínimo,
  // tempo estimado) — o client só mostra um preview, nunca decide o valor
  // final.
  let addressSnapshot: AddressSnapshot | null = null;
  let deliveryFee = 0;
  let estimatedTimeMinutes = restaurant.estimated_time_minutes;

  if (data.deliveryType === "delivery") {
    let address: CustomerAddress;

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
    const { data: tiers } = await db
      .from("delivery_distance_tiers")
      .select("*")
      .eq("restaurant_id", restaurant.id);

    let latitude = address.latitude;
    let longitude = address.longitude;
    if (restaurant.delivery_charge_mode !== "neighborhood" && (latitude == null || longitude == null)) {
      const geocoded = await geocodeAddress(
        `${address.street}, ${address.number}, ${address.neighborhood}, ${address.city}, ${address.state ?? ""}, Brasil`,
      );
      latitude = geocoded?.latitude ?? null;
      longitude = geocoded?.longitude ?? null;
      if (latitude != null && longitude != null) {
        await db.from("customer_addresses").update({ latitude, longitude }).eq("id", address.id);
      }
    }

    const quote = resolveDeliveryQuote(restaurant, zones ?? [], tiers ?? [], {
      state: address.state,
      city: address.city,
      neighborhood: address.neighborhood,
      latitude,
      longitude,
    });
    if (!quote.eligible) return { error: quote.reason };

    deliveryFee = applyFreeShipping(quote.fee, subtotal, restaurant.free_shipping_threshold);
    estimatedTimeMinutes = quote.estimatedTimeMinutes ?? restaurant.estimated_time_minutes;

    const minOrder = quote.matchedZone?.min_order_value ?? restaurant.min_order_value;
    if (subtotal < minOrder) {
      return { error: `Pedido mínimo para entrega: R$ ${minOrder.toFixed(2)}.` };
    }

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
  } else {
    estimatedTimeMinutes = restaurant.pickup_estimated_time_minutes ?? restaurant.estimated_time_minutes;
    const pickupMinOrder = restaurant.pickup_min_order_value ?? 0;
    if (subtotal < pickupMinOrder) {
      return { error: `Pedido mínimo para retirada: R$ ${pickupMinOrder.toFixed(2)}.` };
    }
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

    if (coupon) {
      const [{ count: usedByCustomerCount }, { count: priorOrdersCount }, { data: eligibleProducts }, { data: eligibleCategories }] =
        await Promise.all([
          db
            .from("coupon_usages")
            .select("id", { count: "exact", head: true })
            .eq("coupon_id", coupon.id)
            .eq("user_id", profile.id),
          db
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("restaurant_id", restaurant.id)
            .eq("customer_id", profile.id),
          coupon.applies_to_all_products
            ? Promise.resolve({ data: [] as { product_id: string }[] })
            : db.from("coupon_products").select("product_id").eq("coupon_id", coupon.id),
          coupon.applies_to_all_products
            ? Promise.resolve({ data: [] as { category_id: string }[] })
            : db.from("coupon_categories").select("category_id").eq("coupon_id", coupon.id),
        ]);

      const evaluation = evaluateCoupon(coupon, {
        subtotal,
        items: resolvedItems.map((i) => ({ productId: i.productId, categoryId: i.categoryId, subtotal: i.subtotal })),
        deliveryType: data.deliveryType,
        isFirstPurchase: (priorOrdersCount ?? 0) === 0,
        usedByCustomerCount: usedByCustomerCount ?? 0,
        eligibleProductIds: coupon.applies_to_all_products ? null : new Set((eligibleProducts ?? []).map((p) => p.product_id)),
        eligibleCategoryIds: coupon.applies_to_all_products ? null : new Set((eligibleCategories ?? []).map((c) => c.category_id)),
      });
      if ("error" in evaluation) return { error: evaluation.error };
      discount = roundCurrency(evaluation.discount);
      if (evaluation.freeShipping) deliveryFee = 0;
      couponId = coupon.id;
    } else {
      return { error: "Cupom não encontrado." };
    }
  }

  const total = roundCurrency(Math.max(0, subtotal - discount + deliveryFee));

  const changeFor = data.paymentMethod === "cash" && data.needsChange ? (data.changeFor ?? null) : null;
  if (data.paymentMethod === "cash" && data.needsChange && (changeFor === null || changeFor < total)) {
    return { error: "Informe um valor de troco válido." };
  }

  // --- estoque: valida e decrementa de forma atômica, sempre a partir do
  // banco (nunca confia no client) — a soma de quantidade por produto
  // cobre o caso de dois itens do carrinho serem o mesmo produto com
  // adicionais diferentes. O pré-check aqui só existe pra dar uma mensagem
  // de erro melhor; a garantia real de não ficar negativo em concorrência
  // é o UPDATE condicional dentro de decrement_products_stock (ver
  // supabase/migrations/20260826000001_product_stock.sql), chamado uma
  // única vez com todos os produtos — se qualquer um não tiver estoque
  // suficiente no momento exato do UPDATE, a function inteira falha e
  // nenhum produto é decrementado.
  const quantityByProduct = new Map<string, number>();
  for (const item of resolvedItems) {
    quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) ?? 0) + item.quantity);
  }
  for (const [productId, quantity] of quantityByProduct) {
    const product = productMap.get(productId);
    if (product && !product.unlimited_stock && product.stock_quantity < quantity) {
      return { error: `Estoque insuficiente para "${product.name}". Disponível: ${product.stock_quantity}.` };
    }
  }
  const { error: stockError } = await db.rpc("decrement_products_stock", {
    p_items: Array.from(quantityByProduct.entries()).map(([product_id, quantity]) => ({ product_id, quantity })),
  });
  if (stockError) {
    return { error: "Estoque insuficiente para um ou mais itens. Atualize o carrinho e tente novamente." };
  }

  // Aceite automático: o pedido já nasce no status correto (nunca passa por
  // "new" de verdade quando ligado) — mesmo destino que updateOrderStatusAction
  // usaria pra aceitar manualmente, só que sem a etapa manual.
  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({
      restaurant_id: restaurant.id,
      customer_id: profile.id,
      status: restaurant.auto_accept_orders ? "accepted" : "new",
      accepted_at: restaurant.auto_accept_orders ? new Date().toISOString() : null,
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
      estimated_time_minutes: estimatedTimeMinutes,
    })
    .select("id, number")
    .single();

  if (orderError || !order) {
    // O estoque já tinha sido decrementado acima — como o pedido em si não
    // foi criado, devolve pro estoque em vez de deixar a quantidade
    // "perdida".
    await db.rpc("restore_products_stock", {
      p_items: Array.from(quantityByProduct.entries()).map(([product_id, quantity]) => ({ product_id, quantity })),
    });
    return { error: "Não foi possível criar o pedido. Tente novamente." };
  }

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

  if (itemsError || !insertedItems) {
    await db.rpc("restore_products_stock", {
      p_items: Array.from(quantityByProduct.entries()).map(([product_id, quantity]) => ({ product_id, quantity })),
    });
    return { error: "Não foi possível registrar os itens do pedido." };
  }

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
