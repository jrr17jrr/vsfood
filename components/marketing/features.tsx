import {
  BookOpenText,
  ShoppingBag,
  CreditCard,
  QrCode as QrCodeIcon,
  PlusCircle,
  Ticket,
  Truck,
  Store,
  BarChart3,
  Palette,
  ClipboardList,
  History,
  UserCircle,
  Banknote,
} from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const features = [
  { icon: BookOpenText, label: "Cardápio digital" },
  { icon: ShoppingBag, label: "Pedidos online" },
  { icon: CreditCard, label: "Pagamento online" },
  { icon: Banknote, label: "PIX" },
  { icon: CreditCard, label: "Cartão" },
  { icon: PlusCircle, label: "Adicionais" },
  { icon: Ticket, label: "Cupons" },
  { icon: Truck, label: "Taxas de entrega" },
  { icon: Store, label: "Entrega e retirada" },
  { icon: QrCodeIcon, label: "QR Code" },
  { icon: BarChart3, label: "Relatórios" },
  { icon: Palette, label: "Personalização" },
  { icon: ClipboardList, label: "Painel de pedidos" },
  { icon: History, label: "Histórico" },
  { icon: UserCircle, label: "Conta de cliente" },
];

export function Features() {
  return (
    <section id="recursos" className="relative border-y border-border/60 bg-secondary/20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Tudo que seu delivery precisa</h2>
          <p className="mt-3 text-muted-foreground">Um único sistema, sem depender de terceiros.</p>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {features.map((f, i) => (
            <Reveal key={f.label} delayMs={(i % 5) * 60}>
              <div className="group flex h-full flex-col items-center gap-2.5 rounded-2xl border border-border/70 bg-card/60 p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card hover:shadow-[0_8px_30px_-12px_rgba(240,99,29,0.35)]">
                <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <f.icon className="size-5" />
                </div>
                <span className="text-sm font-medium">{f.label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
