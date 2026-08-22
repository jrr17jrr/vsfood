import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { AccountNav } from "@/components/account/account-nav";
import { requireCustomer } from "@/lib/auth";

export default async function MinhaContaLayout({ children }: { children: React.ReactNode }) {
  await requireCustomer();

  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-bold tracking-tight">Minha conta</h1>
          <div className="mt-6 grid gap-6 sm:grid-cols-[200px_1fr]">
            <AccountNav />
            <div>{children}</div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
