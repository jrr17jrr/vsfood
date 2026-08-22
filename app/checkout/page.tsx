import type { Metadata } from "next";
import { requireCustomer } from "@/lib/auth";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";

export const metadata: Metadata = { title: "Finalizar pedido" };

export default async function CheckoutPage() {
  const profile = await requireCustomer("/checkout");

  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-bold tracking-tight">Finalizar pedido</h1>
          <div className="mt-6">
            <CheckoutFlow customerEmail={profile.email ?? ""} initialWhatsapp={profile.whatsapp} />
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
