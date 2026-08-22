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
    <section id="recursos" className="bg-secondary/30 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Tudo que seu delivery precisa</h2>
          <p className="mt-3 text-muted-foreground">Um único sistema, sem depender de terceiros.</p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {features.map((f) => (
            <div
              key={f.label}
              className="flex flex-col items-center gap-2 rounded-2xl border bg-card p-5 text-center transition-colors hover:border-primary/40"
            >
              <f.icon className="size-6 text-primary" />
              <span className="text-sm font-medium">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
