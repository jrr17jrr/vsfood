"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Store, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { VsfoodLogo } from "@/components/layout/vsfood-logo";
import { signOutAction } from "@/lib/actions/auth";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/restaurantes", label: "Restaurantes", icon: Store },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {links.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
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
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar p-4 sm:flex">
      <Link href="/admin" className="mb-1">
        <VsfoodLogo />
      </Link>
      <p className="mb-6 text-xs text-muted-foreground">Painel DEV</p>
      <NavLinks />
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

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between border-b bg-background p-4 sm:hidden">
      <Link href="/admin">
        <VsfoodLogo />
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-4">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <p className="mb-6 text-xs text-muted-foreground">Painel DEV</p>
          <NavLinks onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
