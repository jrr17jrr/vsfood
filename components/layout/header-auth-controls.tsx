"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  ShoppingBag,
  Store,
  User,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";
import type { UserRole } from "@/types/database";

export type HeaderProfile = {
  name: string;
  avatarUrl: string | null;
  role: UserRole;
};

const NAV_LINKS = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#recursos", label: "Recursos" },
  { href: "/#planos", label: "Planos" },
];

type MenuLink = { href: string; label: string; icon: LucideIcon };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

function displayName(profile: HeaderProfile): string {
  return profile.role === "admin" ? "Admin" : profile.name;
}

function desktopLinks(profile: HeaderProfile, storeSlug: string | null): MenuLink[] {
  if (profile.role === "admin") {
    return [
      { href: "/admin", label: "Painel administrativo", icon: ShieldCheck },
      { href: "/minha-conta", label: "Minha conta", icon: User },
    ];
  }
  if (profile.role === "restaurant_owner") {
    const links: MenuLink[] = [{ href: "/painel", label: "Meu painel", icon: LayoutDashboard }];
    if (storeSlug) links.push({ href: `/loja/${storeSlug}`, label: "Ver minha loja", icon: Store });
    links.push({ href: "/minha-conta", label: "Minha conta", icon: User });
    return links;
  }
  return [
    { href: "/minha-conta", label: "Minha conta", icon: User },
    { href: "/minha-conta/pedidos", label: "Meus pedidos", icon: ShoppingBag },
  ];
}

function mobileLinks(profile: HeaderProfile, storeSlug: string | null): MenuLink[] {
  if (profile.role === "admin") {
    return [
      { href: "/admin", label: "Painel administrativo", icon: ShieldCheck },
      { href: "/minha-conta", label: "Minha conta", icon: User },
    ];
  }
  if (profile.role === "restaurant_owner") {
    const links: MenuLink[] = [{ href: "/painel", label: "Painel", icon: LayoutDashboard }];
    if (storeSlug) links.push({ href: `/loja/${storeSlug}`, label: "Ver loja", icon: Store });
    return links;
  }
  return [
    { href: "/minha-conta", label: "Minha conta", icon: User },
    { href: "/minha-conta/pedidos", label: "Meus pedidos", icon: ShoppingBag },
  ];
}

function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOutAction} className={className}>
      <button type="submit" className="flex w-full items-center gap-1.5 text-destructive">
        <LogOut className="size-4" />
        Sair
      </button>
    </form>
  );
}

export function DesktopUserMenu({ profile, storeSlug }: { profile: HeaderProfile; storeSlug: string | null }) {
  const links = desktopLinks(profile, storeSlug);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm font-medium hover:bg-secondary">
          <Avatar size="sm">
            {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.name} />}
            <AvatarFallback>{initials(profile.name)}</AvatarFallback>
          </Avatar>
          {displayName(profile)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Olá, {displayName(profile)}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {links.map((link) => (
          <DropdownMenuItem key={link.href} asChild>
            <Link href={link.href} className="flex items-center gap-1.5">
              <link.icon className="size-4" />
              {link.label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild variant="destructive">
          <SignOutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MobileMenu({ profile, storeSlug }: { profile: HeaderProfile | null; storeSlug: string | null }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="md:hidden">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-4">
        <SheetTitle className="sr-only">Menu</SheetTitle>

        {profile ? (
          <div className="mb-4 flex items-center gap-2.5 border-b pb-4">
            <Avatar>
              {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.name} />}
              <AvatarFallback>{initials(profile.name)}</AvatarFallback>
            </Avatar>
            <p className="font-medium">Olá, {displayName(profile)}</p>
          </div>
        ) : (
          <div className="mb-4 flex flex-col gap-2 border-b pb-4">
            <Button asChild onClick={close}>
              <Link href="/cadastro?tipo=restaurante">Começar grátis</Link>
            </Button>
            <Button asChild variant="outline" onClick={close}>
              <Link href="/login">Entrar</Link>
            </Button>
          </div>
        )}

        <nav className="flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {profile && (
          <>
            <div className="my-2 h-px bg-border" />
            <nav className="flex flex-col gap-1">
              {mobileLinks(profile, storeSlug).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium hover:bg-secondary"
                >
                  <link.icon className="size-4" />
                  {link.label}
                </Link>
              ))}
              <SignOutButton className="rounded-lg px-2 py-2 text-sm font-medium hover:bg-secondary" />
            </nav>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
