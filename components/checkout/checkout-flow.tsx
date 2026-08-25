"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ShoppingBag, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { cartSubtotal, useCartStore } from "@/lib/store/cart";
import { formatCurrencyBRL } from "@/lib/format";
import { createOrderAction } from "@/lib/actions/orders";
import { getPaymentCapabilitiesAction } from "@/lib/actions/checkout";
import { AddressForm } from "@/components/account/address-form";
import { CardPaymentBrick, type CardBrickSubmitData } from "./card-payment-brick";
import { WhatsappGate } from "./whatsapp-gate";
import type { AddressInput } from "@/lib/validations/checkout";
import type { CustomerAddress, DeliveryZone, PaymentMethod, Restaurant } from "@/types/database";

const OFFLINE_PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "pix_manual", label: "PIX (chave manual com o restaurante)" },
  { value: "cash", label: "Dinheiro" },
  { value: "card_on_delivery", label: "Cartão na entrega" },
];

const ONLINE_PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "pix_online", label: "PIX (aprovação automática)" },
  { value: "card_online", label: "Cartão de crédito (online)" },
];

function restaurantAddressLine(restaurant: Restaurant): string | null {
  if (!restaurant.street) return null;
  const parts = [
    `${restaurant.street}, ${restaurant.number ?? "s/n"}`,
    restaurant.complement || null,
    restaurant.neighborhood ? `${restaurant.neighborhood}, ${restaurant.city ?? ""}` : restaurant.city,
  ].filter(Boolean);
  return parts.join(" — ");
}

export function CheckoutFlow({
  customerEmail,
  initialWhatsapp,
}: {
  customerEmail: string;
  initialWhatsapp: string | null;
}) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const restaurantId = useCartStore((s) => s.restaurantId);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotal = cartSubtotal(items);
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [mpCapabilities, setMpCapabilities] = useState<{ onlineAvailable: boolean; publicKey: string | null }>({
    onlineAvailable: false,
    publicKey: null,
  });
  const [contextLoaded, setContextLoaded] = useState(false);

  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [addressId, setAddressId] = useState<string | "new" | undefined>();
  const [newAddress, setNewAddress] = useState<AddressInput | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix_manual");
  const [needsChange, setNeedsChange] = useState(false);
  const [changeFor, setChangeFor] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    const supabase = createClient();
    (async () => {
      const [{ data: restaurantData }, { data: zonesData }, { data: addressesData }, capabilities] = await Promise.all([
        supabase.from("restaurants").select("*").eq("id", restaurantId).maybeSingle(),
        supabase.from("delivery_zones").select("*").eq("restaurant_id", restaurantId).eq("active", true).order("order"),
        supabase.from("customer_addresses").select("*").order("is_default", { ascending: false }),
        getPaymentCapabilitiesAction(restaurantId),
      ]);
      if (cancelled) return;
      setRestaurant(restaurantData ?? null);
      setZones(zonesData ?? []);
      setAddresses(addressesData ?? []);
      setAddressId(addressesData && addressesData.length > 0 ? addressesData[0].id : "new");
      setMpCapabilities(capabilities);
      setContextLoaded(true);
      // Se só um método estiver habilitado, já entra com ele selecionado —
      // sem mostrar a escolha (pedido explícito: só mostrar seleção quando
      // os dois estiverem disponíveis).
      if (restaurantData && !restaurantData.delivery_enabled && restaurantData.pickup_enabled) {
        setDeliveryType("pickup");
      } else if (restaurantData && restaurantData.delivery_enabled && !restaurantData.pickup_enabled) {
        setDeliveryType("delivery");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const deliveryEnabled = restaurant?.delivery_enabled ?? true;
  const pickupEnabled = restaurant?.pickup_enabled ?? true;
  const showDeliveryTypeChoice = deliveryEnabled && pickupEnabled;

  const selectedAddress = addresses.find((a) => a.id === addressId);
  const neighborhood = (selectedAddress?.neighborhood ?? newAddress?.neighborhood ?? "").trim().toLowerCase();

  const matchedZone = useMemo(() => {
    if (deliveryType !== "delivery" || zones.length === 0) return null;
    return zones.find((z) => z.neighborhood.trim().toLowerCase() === neighborhood) ?? null;
  }, [deliveryType, zones, neighborhood]);

  const noZonesConfigured = zones.length === 0;
  const rawDeliveryFee =
    deliveryType !== "delivery"
      ? 0
      : noZonesConfigured
        ? 0
        : !neighborhood
          ? null
          : matchedZone
            ? matchedZone.fee
            : null;

  const freeShippingThreshold = restaurant?.free_shipping_threshold ?? null;
  const freeShippingApplied =
    rawDeliveryFee !== null && rawDeliveryFee > 0 && freeShippingThreshold != null && subtotal >= freeShippingThreshold;
  const deliveryFee = rawDeliveryFee === null ? null : freeShippingApplied ? 0 : rawDeliveryFee;

  const total = Math.max(0, subtotal + (deliveryFee ?? 0));

  const effectiveMinOrder =
    deliveryType === "pickup"
      ? (restaurant?.pickup_min_order_value ?? 0)
      : (matchedZone?.min_order_value ?? restaurant?.min_order_value ?? 0);
  const belowMinimum = subtotal < effectiveMinOrder;

  const estimatedTime =
    deliveryType === "pickup"
      ? (restaurant?.pickup_estimated_time_minutes ?? restaurant?.estimated_time_minutes)
      : (matchedZone?.estimated_time_minutes ?? restaurant?.estimated_time_minutes);

  async function submitOrder(card?: CardBrickSubmitData) {
    if (!restaurantId) return;
    if (deliveryType === "delivery" && addressId === "new" && !newAddress) {
      toast.error("Preencha o endereço de entrega.");
      return;
    }
    if (paymentMethod === "cash" && needsChange && !changeFor) {
      toast.error("Informe o valor para o troco.");
      return;
    }

    setSubmitting(true);
    const result = await createOrderAction({
      restaurantId,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        notes: item.notes,
        optionIds: item.options.map((o) => ({ groupId: o.groupId, optionId: o.optionId })),
      })),
      deliveryType,
      addressId: deliveryType === "delivery" && addressId !== "new" ? addressId : undefined,
      newAddress: deliveryType === "delivery" && addressId === "new" ? (newAddress ?? undefined) : undefined,
      couponCode: couponCode.trim() || undefined,
      paymentMethod,
      needsChange: paymentMethod === "cash" ? needsChange : undefined,
      changeFor: paymentMethod === "cash" && needsChange ? Number(changeFor.replace(",", ".")) : undefined,
      notes: notes.trim() || undefined,
      card,
    });
    setSubmitting(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    if (result.paymentStatus === "rejected") {
      toast.error(result.paymentError ?? "Pagamento recusado. Tente novamente.");
      return;
    }

    clearCart();
    router.push(`/pedido/${result.orderId}`);
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
        <ShoppingBag className="size-10" />
        <p className="font-medium text-foreground">Seu carrinho está vazio</p>
        <p className="text-sm">Adicione produtos ao carrinho antes de finalizar o pedido.</p>
        <Button asChild>
          <Link href="/restaurantes">Ver restaurantes</Link>
        </Button>
      </div>
    );
  }

  if (restaurantId && !contextLoaded) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (restaurant && !deliveryEnabled && !pickupEnabled) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
        <Store className="size-10" />
        <p className="font-medium text-foreground">Esta loja não está aceitando pedidos no momento</p>
        <p className="text-sm">Entrega e retirada estão desativadas — tente novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <>
      <WhatsappGate open={!whatsapp} onSaved={setWhatsapp} />
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        {showDeliveryTypeChoice && (
          <section>
            <h2 className="font-semibold">Entrega ou retirada</h2>
            <RadioGroup
              className="mt-3 grid grid-cols-2 gap-3"
              value={deliveryType}
              onValueChange={(v) => setDeliveryType(v as "delivery" | "pickup")}
            >
              <Label className="flex cursor-pointer items-center gap-2 rounded-xl border p-3 has-[[data-state=checked]]:border-primary">
                <RadioGroupItem value="delivery" />
                Entrega
              </Label>
              <Label className="flex cursor-pointer items-center gap-2 rounded-xl border p-3 has-[[data-state=checked]]:border-primary">
                <RadioGroupItem value="pickup" />
                Retirada no local
              </Label>
            </RadioGroup>
          </section>
        )}

        {deliveryType === "delivery" ? (
          <section>
            <h2 className="font-semibold">Endereço</h2>
            <div className="mt-3 space-y-3">
              {addresses.length > 0 && (
                <RadioGroup value={addressId} onValueChange={(v) => setAddressId(v)} className="space-y-2">
                  {addresses.map((a) => (
                    <Label key={a.id} className="flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm has-[[data-state=checked]]:border-primary">
                      <RadioGroupItem value={a.id} className="mt-0.5" />
                      <span>
                        <span className="block font-medium">{a.label || "Endereço"}</span>
                        <span className="text-muted-foreground">
                          {a.street}, {a.number} · {a.neighborhood}, {a.city}
                        </span>
                      </span>
                    </Label>
                  ))}
                  <Label className="flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm has-[[data-state=checked]]:border-primary">
                    <RadioGroupItem value="new" />
                    Usar outro endereço
                  </Label>
                </RadioGroup>
              )}

              {(addresses.length === 0 || addressId === "new") && (
                <div className="rounded-xl border p-4">
                  <AddressForm
                    submitLabel="Usar este endereço"
                    onSubmit={async (values) => {
                      setNewAddress(values);
                      toast.success("Endereço preenchido. Continue para pagamento.");
                    }}
                  />
                </div>
              )}

              {rawDeliveryFee === null && (selectedAddress || newAddress) && (
                <p className="text-sm font-medium text-destructive">Não entregamos neste bairro.</p>
              )}
            </div>
          </section>
        ) : (
          <section>
            <h2 className="font-semibold">Retirada no local</h2>
            <div className="mt-3 rounded-xl border p-4 text-sm">
              {restaurant && restaurantAddressLine(restaurant) ? (
                <p className="text-muted-foreground">{restaurantAddressLine(restaurant)}</p>
              ) : (
                <p className="text-muted-foreground">Endereço do restaurante ainda não cadastrado.</p>
              )}
              {estimatedTime != null && (
                <p className="mt-1 text-muted-foreground">Tempo estimado para retirada: {estimatedTime} min</p>
              )}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-semibold">Cupom de desconto</h2>
          <div className="mt-3 flex gap-2">
            <Input placeholder="Código do cupom" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
          </div>
        </section>

        <section>
          <h2 className="font-semibold">Forma de pagamento</h2>
          <RadioGroup className="mt-3 space-y-2" value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
            {mpCapabilities.onlineAvailable &&
              ONLINE_PAYMENT_METHODS.map((m) => (
                <Label key={m.value} className="flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm has-[[data-state=checked]]:border-primary">
                  <RadioGroupItem value={m.value} />
                  {m.label}
                </Label>
              ))}
            {OFFLINE_PAYMENT_METHODS.map((m) => (
              <Label key={m.value} className="flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm has-[[data-state=checked]]:border-primary">
                <RadioGroupItem value={m.value} />
                {m.label}
              </Label>
            ))}
          </RadioGroup>

          {paymentMethod === "cash" && (
            <div className="mt-3 space-y-2 rounded-xl border p-3">
              <Label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={needsChange} onChange={(e) => setNeedsChange(e.target.checked)} />
                Precisa de troco?
              </Label>
              {needsChange && (
                <Input
                  placeholder="Troco para quanto?"
                  value={changeFor}
                  onChange={(e) => setChangeFor(e.target.value)}
                />
              )}
            </div>
          )}

          {paymentMethod === "card_online" && mpCapabilities.publicKey && (
            <div className="mt-3 rounded-xl border p-3">
              <CardPaymentBrick
                publicKey={mpCapabilities.publicKey}
                amount={total}
                payerEmail={customerEmail}
                submitting={submitting}
                onSubmit={(card) => submitOrder(card)}
              />
            </div>
          )}
        </section>

        <section>
          <h2 className="font-semibold">Observações do pedido</h2>
          <Textarea
            className="mt-3"
            placeholder="Ex: tocar interfone 202"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </section>
      </div>

      <aside className="h-fit rounded-2xl border bg-card p-5">
        <h2 className="font-semibold">Resumo do pedido</h2>
        <div className="mt-3 space-y-2 text-sm">
          {items.map((item) => (
            <div key={item.lineId} className="flex justify-between text-muted-foreground">
              <span>
                {item.quantity}x {item.name}
              </span>
              <span>{formatCurrencyBRL((item.unitBasePrice + item.options.reduce((s, o) => s + o.price, 0)) * item.quantity)}</span>
            </div>
          ))}
        </div>
        <Separator className="my-3" />
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrencyBRL(subtotal)}</span>
          </div>
          {deliveryType === "delivery" && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxa de entrega</span>
              <span>
                {rawDeliveryFee === null
                  ? "—"
                  : freeShippingApplied
                    ? <span className="text-primary">Grátis</span>
                    : formatCurrencyBRL(rawDeliveryFee)}
              </span>
            </div>
          )}
          {freeShippingApplied && (
            <div className="flex justify-between text-primary">
              <span>Frete grátis aplicado</span>
              <span>-{formatCurrencyBRL(rawDeliveryFee ?? 0)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatCurrencyBRL(total)}</span>
          </div>
        </div>

        {deliveryType === "delivery" && estimatedTime != null && rawDeliveryFee !== null && (
          <p className="mt-3 text-xs text-muted-foreground">Tempo estimado de entrega: {estimatedTime} min</p>
        )}

        {belowMinimum && effectiveMinOrder > 0 && (
          <p className="mt-3 text-sm font-medium text-destructive">
            Pedido mínimo para {deliveryType === "delivery" ? "entrega" : "retirada"}: {formatCurrencyBRL(effectiveMinOrder)}
          </p>
        )}

        {paymentMethod !== "card_online" && (
          <Button
            size="lg"
            className="mt-4 w-full"
            disabled={submitting || belowMinimum || (deliveryType === "delivery" && deliveryFee === null)}
            onClick={() => submitOrder()}
          >
            {submitting ? "Enviando pedido..." : "Confirmar pedido"}
          </Button>
        )}
      </aside>
      </div>
    </>
  );
}
