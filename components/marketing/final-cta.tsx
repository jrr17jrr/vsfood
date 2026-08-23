import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="border-t bg-secondary/30 py-20">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Pronto para ter sua própria loja online?
        </h2>
        <p className="text-muted-foreground">
          Fale com o VSFood e comece a receber pedidos no seu próprio site em poucos dias.
        </p>
        <Button size="lg" asChild>
          <Link href="/cadastro?tipo=restaurante">Quero minha loja</Link>
        </Button>
      </div>
    </section>
  );
}
