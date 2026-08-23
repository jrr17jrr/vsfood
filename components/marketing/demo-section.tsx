import Link from "next/link";
import Image from "next/image";
import { BookOpenText, Palette, ShoppingBag, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDemoRestaurant } from "@/lib/data/marketing";

const highlights = [
  { icon: BookOpenText, label: "Cardápio digital" },
  { icon: ShoppingBag, label: "Pedidos online" },
  { icon: Palette, label: "Personalização" },
  { icon: Smartphone, label: "Responsivo" },
];

export async function DemoSection() {
  const demo = await getDemoRestaurant();
  if (!demo) return null;

  return (
    <section id="demonstracao" className="mx-auto max-w-6xl px-4 py-20">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Veja o VSFood funcionando de verdade</h2>
          <p className="mt-3 text-muted-foreground">
            Abra a <span className="font-semibold text-foreground">{demo.name}</span>, uma loja real de
            demonstração, e veja exatamente a experiência que seus clientes vão ter na sua própria loja.
          </p>

          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3">
            {highlights.map((h) => (
              <li key={h.label} className="flex items-center gap-2 text-sm font-medium">
                <h.icon className="size-4 shrink-0 text-primary" />
                {h.label}
              </li>
            ))}
          </ul>

          <Button size="lg" className="mt-8 w-full sm:w-auto" asChild>
            <Link href={`/loja/${demo.slug}`}>Ver loja demonstração</Link>
          </Button>
        </div>

        <Link href={`/loja/${demo.slug}`} className="block rounded-3xl transition-transform hover:scale-[1.01]">
          <div className="overflow-hidden rounded-3xl border bg-card shadow-xl">
            <div className="relative aspect-[2/1] w-full bg-muted">
              {demo.banner_url ? (
                <Image src={demo.banner_url} alt="" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover object-center" />
              ) : (
                <div className="size-full bg-gradient-to-br from-brand-orange to-brand-red" />
              )}
            </div>
            <div className="flex items-center gap-3 p-5">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border bg-card p-1.5 shadow-sm">
                {demo.logo_url ? (
                  <Image src={demo.logo_url} alt={demo.name} fill sizes="56px" className="object-contain" />
                ) : (
                  <div className="grid size-full place-items-center bg-secondary text-lg font-bold text-secondary-foreground">
                    {demo.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold">{demo.name}</p>
                  <Badge variant="secondary">Demonstração</Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {demo.cuisine_type || demo.description || "Loja de demonstração VSFood"}
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
