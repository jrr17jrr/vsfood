"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { signUpFormSchema, type SignUpFormInput } from "@/lib/validations/auth";
import { signUpAction } from "@/lib/actions/auth";
import { GoogleAuthButton } from "./google-auth-button";
import { AuthDivider } from "./auth-divider";

export function SignUpForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormInput>({ resolver: zodResolver(signUpFormSchema) });

  async function onSubmit(values: SignUpFormInput) {
    setServerError(null);
    setLoading(true);
    try {
      const result = await signUpAction(values);
      if (result?.error) {
        setServerError(result.error);
      } else if (result?.checkEmail) {
        setCheckEmail(true);
      }
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="size-10 text-primary" />
        <p className="font-medium">Confirme seu e-mail</p>
        <p className="text-sm text-muted-foreground">
          Enviamos um link de confirmação. Depois de confirmar, você já pode fazer login.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <GoogleAuthButton />
      <AuthDivider />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome completo</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" placeholder="(11) 99999-9999" {...register("whatsapp")} />
          {errors.whatsapp && <p className="text-xs text-destructive">{errors.whatsapp.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <PasswordInput id="password" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <PasswordInput id="confirmPassword" {...register("confirmPassword")} />
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Criando conta..." : "Criar conta"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
