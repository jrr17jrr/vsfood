"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { getSafeRedirectPath } from "@/lib/redirect";
import { GoogleIcon } from "./google-icon";

export function GoogleAuthButton({ redirectTo }: { redirectTo?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);

    const next = getSafeRedirectPath(redirectTo, "/minha-conta");
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    // Em caso de sucesso o navegador já foi redirecionado para o Google;
    // só chegamos aqui se algo falhou antes disso (ex: provider desabilitado).
    if (error) {
      setLoading(false);
      toast.error("Não foi possível iniciar o login com Google. Tente novamente.");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2 border-input bg-white text-foreground hover:bg-secondary dark:bg-card"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon className="size-4" />}
      {loading ? "Conectando com Google..." : "Continuar com Google"}
    </Button>
  );
}
