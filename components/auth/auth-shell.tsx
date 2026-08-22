import Link from "next/link";
import { VsfoodLogo } from "@/components/layout/vsfood-logo";
import { PublicFooter } from "@/components/layout/public-footer";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex justify-center">
            <VsfoodLogo />
          </Link>
          <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
            <h1 className="text-xl font-bold">{title}</h1>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
