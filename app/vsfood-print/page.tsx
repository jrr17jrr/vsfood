import type { Metadata } from "next";
import Link from "next/link";
import {
  Download,
  MonitorDown,
  Wrench,
  KeyRound,
  Hash,
  Printer,
  FileCheck,
  Zap,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "VSFood Print",
  description: "Seus pedidos impressos automaticamente, direto na cozinha.",
};

const DOWNLOAD_URL = process.env.NEXT_PUBLIC_VSFOOD_PRINT_DOWNLOAD_URL;

const steps = [
  { icon: MonitorDown, text: "Baixe o aplicativo" },
  { icon: Wrench, text: "Instale no computador da loja" },
  { icon: Wrench, text: "Abra Painel > Impressão" },
  { icon: Hash, text: "Gere o código de conexão" },
  { icon: KeyRound, text: "Digite o código no VSFood Print" },
  { icon: Printer, text: "Escolha sua impressora" },
  { icon: FileCheck, text: "Faça uma impressão de teste" },
  { icon: Zap, text: "Ative a impressão automática" },
];

export default function VsfoodPrintPage() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden py-20 sm:py-28">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent" />
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">VSFood Print</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Seus pedidos impressos automaticamente, direto na cozinha.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3">
              {DOWNLOAD_URL ? (
                <Button size="lg" className="h-12 px-8 text-base" asChild>
                  <a href={DOWNLOAD_URL}>
                    <Download className="size-5" />
                    Baixar VSFood Print para Windows
                  </a>
                </Button>
              ) : (
                <>
                  <Button size="lg" className="h-12 px-8 text-base" disabled>
                    <Download className="size-5" />
                    Baixar VSFood Print para Windows
                  </Button>
                  <Badge variant="secondary">Disponível em breve</Badge>
                </>
              )}
              <p className="text-xs text-muted-foreground">Windows · v0.1.0 · Suporte a impressoras A4</p>
            </div>
          </div>
        </section>

        <section className="border-y border-border/60 bg-secondary/20 py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Como configurar</h2>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2">
              {steps.map((step, i) => (
                <li
                  key={step.text}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/70 p-4"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="size-5" />
                  </div>
                  <p className="text-sm font-medium">
                    <span className="mr-1.5 text-primary">{i + 1}.</span>
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-16 text-center sm:py-24">
          <div className="mx-auto max-w-lg px-4">
            <p className="text-sm text-muted-foreground">
              Já configurou sua loja? Gere o código de conexão em{" "}
              <Link href="/painel/impressao" className="font-medium text-primary underline underline-offset-4">
                Painel &gt; Impressão
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
