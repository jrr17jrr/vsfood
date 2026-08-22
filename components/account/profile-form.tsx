"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { onlyDigits } from "@/lib/format";
import { updateProfileAction } from "@/lib/actions/profile";
import type { Profile } from "@/types/database";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo"),
  whatsapp: z.string().trim().refine((v) => onlyDigits(v).length >= 10 && onlyDigits(v).length <= 11, "WhatsApp inválido"),
});
type FormValues = z.infer<typeof schema>;

export function ProfileForm({ profile }: { profile: Profile }) {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: profile.name, whatsapp: profile.whatsapp ?? "" },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    const result = await updateProfileAction(values);
    setLoading(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Dados atualizados.");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-4 rounded-2xl border bg-card p-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome completo</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input id="whatsapp" {...register("whatsapp")} />
        {errors.whatsapp && <p className="text-xs text-destructive">{errors.whatsapp.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>E-mail</Label>
        <Input value={profile.email ?? ""} disabled />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
