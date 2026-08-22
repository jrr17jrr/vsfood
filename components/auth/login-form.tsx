"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/lib/actions/auth";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { GoogleAuthButton } from "./google-auth-button";
import { AuthDivider } from "./auth-divider";

export function LoginForm({ redirectTo, errorCode }: { redirectTo?: string; errorCode?: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    const message = getAuthErrorMessage(errorCode);
    if (message) toast.error(message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    setLoading(true);
    try {
      const result = await loginAction(values, redirectTo);
      if (result?.error) setServerError(result.error);
    } catch (err) {
      // NEXT_REDIRECT lançado pelo redirect() do server action é esperado; relança.
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <GoogleAuthButton redirectTo={redirectTo} />
      <AuthDivider />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="identifier">E-mail ou WhatsApp</Label>
          <Input id="identifier" placeholder="voce@email.com ou (11) 99999-9999" {...register("identifier")} />
          {errors.identifier && <p className="text-xs text-destructive">{errors.identifier.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link href="/recuperar-senha" className="text-xs text-primary hover:underline">
              Esqueci minha senha
            </Link>
          </div>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-primary hover:underline">
            Cadastre-se
          </Link>
        </p>
      </form>
    </div>
  );
}
