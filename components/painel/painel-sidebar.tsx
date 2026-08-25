"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  BookOpenText,
  Ticket,
  Clock,
  Truck,
  Palette,
  Wallet,
  BarChart3,
  LogOut,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { VsfoodLogo } from "@/components/layout/vsfood-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { OrderSoundToggle } from "./order-sound-toggle";
import { Badge } from "@/components/ui/badge";
import { signOutAction } from "@/lib/actions/auth";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/painel", label: "Dashboard", icon: LayoutDashboard },
  { href: "/painel/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/painel/cardapio", label: "Cardápio", icon: BookOpenText },
  { href: "/painel/cupons", label: "Cupons", icon: Ticket },
  { href: "/painel/horarios", label: "Horários", icon: Clock },
  { href: "/painel/entrega", label: "Entrega", icon: Truck },
  { href: "/painel/aparencia", label: "Aparência", icon: Palette },
  { href: "/painel/pagamentos", label: "Pagamentos", icon: Wallet },
  { href: "/painel/relatorios", label: "Relatórios", icon: BarChart3 },
];

function NavLinks({ onNavigate, newOrdersCount }: { onNavigate?: () => void; newOrdersCount: number }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {links.map((link) => {
        const active = link.href === "/painel" ? pathname === "/painel" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary",
            )}
          >
            <link.icon className="size-4" />
            {link.label}
            {link.href === "/painel/pedidos" && newOrdersCount > 0 && (
              <Badge
                variant={active ? "secondary" : "default"}
                className={cn("ml-auto", active && "bg-primary-foreground text-primary")}
              >
                {newOrdersCount}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function PainelSidebar({ restaurantName, newOrdersCount }: { restaurantName: string; newOrdersCount: number }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar p-4 sm:flex">
      <Link href="/painel" className="mb-1">
        <VsfoodLogo />
      </Link>
      <div className="mb-6 flex items-center justify-between gap-2">
        <p className="truncate text-xs text-muted-foreground">{restaurantName}</p>
        <div className="flex shrink-0 items-center gap-1">
          <OrderSoundToggle className="size-7" />
          <ThemeToggle className="size-7" />
        </div>
      </div>
      <NavLinks newOrdersCount={newOrdersCount} />
      <form action={signOutAction}>
        <button
          type="submit"
          className="mt-4 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
        >
          <LogOut className="size-4" />
          Sair
        </button>
      </form>
    </aside>
  );
}

export function PainelMobileNav({ restaurantName, newOrdersCount }: { restaurantName: string; newOrdersCount: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between border-b bg-background p-4 sm:hidden">
      <Link href="/painel">
        <VsfoodLogo />
      </Link>
      <div className="flex items-center gap-1">
        <OrderSoundToggle />
        <ThemeToggle />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="relative">
              <Menu className="size-5" />
              {newOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {newOrdersCount > 9 ? "9+" : newOrdersCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <p className="mb-6 truncate text-xs text-muted-foreground">{restaurantName}</p>
            <NavLinks onNavigate={() => setOpen(false)} newOrdersCount={newOrdersCount} />
            <form action={signOutAction}>
              <button
                type="submit"
                className="mt-4 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
              >
                <LogOut className="size-4" />
                Sair
              </button>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
