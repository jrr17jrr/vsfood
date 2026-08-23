"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RestaurantAppearanceInput } from "@/lib/validations/restaurant";
import type { StoreThemeKey } from "@/lib/theme/store-theme";

export function ColorField({
  themeKey,
  label,
  register,
  errors,
}: {
  themeKey: StoreThemeKey;
  label: string;
  register: UseFormRegister<RestaurantAppearanceInput>;
  errors: FieldErrors<RestaurantAppearanceInput>;
}) {
  const error = errors.theme?.[themeKey];

  return (
    <div className="space-y-1.5">
      <Label htmlFor={`theme-${themeKey}`}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input type="color" className="h-10 w-14 shrink-0 p-1" {...register(`theme.${themeKey}`)} />
        <Input
          id={`theme-${themeKey}`}
          className="flex-1 font-mono uppercase"
          maxLength={7}
          {...register(`theme.${themeKey}`)}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error.message as string}</p>}
    </div>
  );
}
