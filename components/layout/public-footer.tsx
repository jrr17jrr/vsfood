import Link from "next/link";
import { VsfoodLogo } from "./vsfood-logo";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <VsfoodLogo className="text-base" />
        <p className="text-sm text-muted-foreground">
          © {year} VSFood • Desenvolvido por{" "}
          <a
            href="https://visionariodev.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4 hover:text-foreground"
          >
            Visionário Dev
          </a>
        </p>
      </div>
    </footer>
  );
}

export function StoreFooter({ restaurantName }: { restaurantName: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-secondary/40 py-6">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-1 px-4 text-center text-xs text-muted-foreground">
        <p>
          {restaurantName} está no VSFood. {" "}
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">
            Crie sua loja também
          </Link>
        </p>
        <p>
          © {year} VSFood • Desenvolvido por{" "}
          <a
            href="https://visionariodev.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Visionário Dev
          </a>
        </p>
      </div>
    </footer>
  );
}
