import { LayoutDashboard, ClipboardList, BookOpenText, Ticket, Clock, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/marketing/reveal";

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
    <section id="painel" className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent" />
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Seu painel, sem complicação</h2>
          <p className="mt-3 text-muted-foreground">
            Gerencie pedidos, cardápio e configurações da sua loja em um painel feito pra você.
          </p>
        </Reveal>

        <Reveal delayMs={100} className="relative mx-auto mt-12 max-w-4xl">
          <div
            className="animate-glow absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-brand-orange/20 to-brand-red/10 blur-3xl"
            aria-hidden
          />
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-2xl shadow-black/10 dark:shadow-black/40">
            <div className="flex items-center gap-1.5 border-b border-border/70 bg-secondary/40 px-4 py-3">
              <span className="size-2.5 rounded-full bg-destructive/60" />
              <span className="size-2.5 rounded-full bg-brand-amber/60" />
              <span className="size-2.5 rounded-full bg-primary/60" />
            </div>
            <div className="flex">
              <div className="hidden w-40 shrink-0 flex-col gap-1 border-r border-border/70 bg-sidebar p-3 sm:flex">
                {navItems.map((item, i) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      i === 1 ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
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
                  <div
                    key={o.number}
                    className="flex items-center justify-between rounded-xl border border-border/70 p-3 text-sm transition-colors hover:border-primary/30"
                  >
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
        </Reveal>
      </div>
    </section>
  );
}
