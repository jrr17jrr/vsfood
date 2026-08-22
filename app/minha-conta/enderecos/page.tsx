import type { Metadata } from "next";
import { requireCustomer } from "@/lib/auth";
import { getCustomerAddresses } from "@/lib/data/account";
import { AddressList } from "@/components/account/address-list";

export const metadata: Metadata = { title: "Meus endereços" };

export default async function EnderecosPage() {
  const profile = await requireCustomer();
  const addresses = await getCustomerAddresses(profile.id);

  return <AddressList addresses={addresses} />;
}
