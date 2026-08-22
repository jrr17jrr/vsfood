"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, MapPin, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/actions/auth";

const links = [
  { href: "/minha-conta", label: "Dados pessoais", icon: User },
  { href: "/minha-conta/enderecos", label: "Meus endereços", icon: MapPin },
  { href: "/minha-conta/pedidos", label: "Meus pedidos", icon: ShoppingBag },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto sm:flex-col sm:overflow-visible">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary",
            )}
          >
            <link.icon className="size-4" />
            {link.label}
          </Link>
        );
      })}
      <form action={signOutAction}>
        <button
          type="submit"
          className="flex w-full shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary sm:w-auto"
        >
          <LogOut className="size-4" />
          Sair
        </button>
      </form>
    </nav>
  );
}
