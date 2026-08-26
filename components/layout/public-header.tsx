import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VsfoodLogo } from "./vsfood-logo";
import { DesktopUserMenu, MobileMenu, type HeaderProfile } from "./header-auth-controls";
import { ThemeToggle } from "./theme-toggle";
import { HeaderScrollShell } from "./header-scroll-shell";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const NAV_LINKS = [
  { href: "/#recursos", label: "Recursos" },
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#planos", label: "Planos" },
  { href: "/#demonstracao", label: "Demonstração" },
  { href: "/#faq", label: "FAQ" },
];

async function getStoreSlug(profileId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("restaurant_users")
    .select("restaurant_id")
    .eq("user_id", profileId)
    .limit(1)
    .maybeSingle();
  if (!membership) return null;

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("slug")
    .eq("id", membership.restaurant_id)
    .maybeSingle();
  return restaurant?.slug ?? null;
}

export async function PublicHeader() {
  const profile = await getCurrentProfile();
  const storeSlug = profile?.role === "restaurant_owner" ? await getStoreSlug(profile.id) : null;
  const headerProfile: HeaderProfile | null = profile
    ? { name: profile.name, avatarUrl: profile.avatar_url, role: profile.role }
    : null;

  return (
    <HeaderScrollShell>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="VSFood">
          <VsfoodLogo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {headerProfile ? (
            <div className="hidden lg:block">
              <DesktopUserMenu profile={headerProfile} storeSlug={storeSlug} />
            </div>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Button variant="ghost" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button className="shadow-[0_0_0_1px_rgba(240,99,29,0.3)] hover:shadow-[0_0_20px_-2px_rgba(240,99,29,0.55)]" asChild>
                <Link href="/cadastro?tipo=restaurante">Criar minha loja</Link>
              </Button>
            </div>
          )}
          <MobileMenu profile={headerProfile} storeSlug={storeSlug} />
        </div>
      </div>
    </HeaderScrollShell>
  );
}
