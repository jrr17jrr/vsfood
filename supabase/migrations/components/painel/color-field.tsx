"use client";

import { useEffect, useRef, useState } from "react";
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
  const field = register(`theme.${themeKey}`);
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const [pickerValue, setPickerValue] = useState("#000000");

  useEffect(() => {
    const current = textInputRef.current?.value;
    if (current && /^#[0-9a-fA-F]{6}$/.test(current)) {
      setPickerValue(current);
    }
  }, []);

  function setRegisteredRef(node: HTMLInputElement | null) {
    textInputRef.current = node;
    field.ref(node);
  }

  function handlePickerChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value.toUpperCase();
    setPickerValue(value);

    if (textInputRef.current) {
      textInputRef.current.value = value;
    }

    field.onChange({
      target: { name: field.name, value },
      type: "change",
    });
  }

  function handleTextChange(event: React.ChangeEvent<HTMLInputElement>) {
    let value = event.target.value.toUpperCase();
    event.target.value = value;
    field.onChange(event);

    if (/^#[0-9A-F]{6}$/.test(value)) {
      setPickerValue(value);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={`theme-${themeKey}`}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="color"
          className="h-10 w-14 shrink-0 p-1"
          value={pickerValue}
          onChange={handlePickerChange}
          aria-label={`${label} - seletor de cor`}
        />
        <Input
          id={`theme-${themeKey}`}
          name={field.name}
          ref={setRegisteredRef}
          onBlur={field.onBlur}
          onChange={handleTextChange}
          className="flex-1 font-mono uppercase"
          maxLength={7}
          placeholder="#FF5A36"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error.message as string}</p>}
    </div>
  );
}
