import Link from "next/link";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDemoRestaurant } from "@/lib/data/marketing";

export async function DemoSection() {
  const demo = await getDemoRestaurant();

  return (
    <section id="demonstracao" className="mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-3xl border bg-card p-10 text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Store className="size-7" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Veja o VSFood funcionando de verdade</h2>
        <p className="text-muted-foreground">
          Explore uma loja de demonstração com cardápio, carrinho e checkout completos — do jeito
          que seus clientes vão ver a sua loja.
        </p>
        {demo ? (
          <Button size="lg" asChild>
            <Link href={`/loja/${demo.slug}`}>Conhecer {demo.name}</Link>
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Demonstração em breve.</p>
        )}
      </div>
    </section>
  );
}
