import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VsfoodLogo } from "./vsfood-logo";
import { DesktopUserMenu, MobileMenu, type HeaderProfile } from "./header-auth-controls";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="VSFood">
          <VsfoodLogo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/#como-funciona" className="hover:text-foreground">
            Como funciona
          </Link>
          <Link href="/#recursos" className="hover:text-foreground">
            Recursos
          </Link>
          <Link href="/#planos" className="hover:text-foreground">
            Planos
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {headerProfile ? (
            <div className="hidden md:block">
              <DesktopUserMenu profile={headerProfile} storeSlug={storeSlug} />
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild>
                <Link href="/cadastro?tipo=restaurante">Começar grátis</Link>
              </Button>
            </div>
          )}
          <MobileMenu profile={headerProfile} storeSlug={storeSlug} />
        </div>
      </div>
    </header>
  );
}
