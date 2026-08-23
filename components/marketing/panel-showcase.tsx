import { LayoutDashboard, ClipboardList, BookOpenText, Ticket, Clock, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Pedidos", icon: ClipboardList },
  { label: "Cardápio", icon: BookOpenText },
  { label: "Cupons", icon: Ticket },
  { label: "Horários", icon: Clock },
  { label: "Entrega", icon: Truck },
];

const orders = [
  { number: "#0142", customer: "Ricardo", total: "R$ 58,90", status: "Novo", variant: "default" as const },
  { number: "#0141", customer: "Marina", total: "R$ 32,00", status: "Preparando", variant: "secondary" as const },
  { number: "#0140", customer: "Felipe", total: "R$ 74,50", status: "Saiu para entrega", variant: "secondary" as const },
];

export function PanelShowcase() {
  return (
    <section id="painel" className="bg-secondary/30 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Seu painel, sem complicação</h2>
          <p className="mt-3 text-muted-foreground">
            Gerencie pedidos, cardápio e configurações da sua loja em um painel feito pra você.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-3xl border bg-card shadow-xl">
          <div className="flex items-center gap-1.5 border-b bg-secondary/40 px-4 py-3">
            <span className="size-2.5 rounded-full bg-destructive/60" />
            <span className="size-2.5 rounded-full bg-brand-amber/60" />
            <span className="size-2.5 rounded-full bg-primary/60" />
          </div>
          <div className="flex">
            <div className="hidden w-40 shrink-0 flex-col gap-1 border-r bg-sidebar p-3 sm:flex">
              {navItems.map((item, i) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                    i === 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </div>
              ))}
            </div>
            <div className="flex-1 space-y-2 p-4">
              <p className="text-xs font-medium text-muted-foreground">Pedidos de hoje</p>
              {orders.map((o) => (
                <div key={o.number} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {o.number} · {o.customer}
                    </p>
                    <p className="text-xs text-muted-foreground">{o.total}</p>
                  </div>
                  <Badge variant={o.variant} className={o.variant === "default" ? "bg-primary" : ""}>
                    {o.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
