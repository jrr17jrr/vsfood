"use client";

import { createClient } from "@/lib/supabase/client";
import { validateImageFile } from "@/lib/upload-validation";

const BUCKET = "restaurants";

// Limites por tipo de upload — última linha de defesa antes do Storage.
// Mantém em sincronia com os textos exibidos perto de cada campo
// (components/painel/appearance-form.tsx e product-basic-info.tsx).
export const LOGO_MAX_SIZE_MB = 5;
export const PRODUCT_IMAGE_MAX_SIZE_MB = 5;
export const BANNER_MAX_SIZE_MB = 8;

// Extensão do arquivo salvo no Storage é sempre derivada do MIME já
// validado (nunca do nome/extensão que o usuário deu ao arquivo).
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function uploadAndGetUrl(path: string, file: File, maxSizeMB: number): Promise<string> {
  const validationError = validateImageFile(file, maxSizeMB);
  if (validationError) throw new Error(validationError);

  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function uploadRestaurantLogo(restaurantId: string, file: File): Promise<string> {
  return uploadAndGetUrl(`${restaurantId}/logo.${EXTENSION_BY_MIME[file.type]}`, file, LOGO_MAX_SIZE_MB);
}

export async function uploadRestaurantBanner(restaurantId: string, file: File): Promise<string> {
  return uploadAndGetUrl(`${restaurantId}/banner.${EXTENSION_BY_MIME[file.type]}`, file, BANNER_MAX_SIZE_MB);
}

export async function uploadProductImage(restaurantId: string, file: File): Promise<string> {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
  return uploadAndGetUrl(`${restaurantId}/products/${id}.${EXTENSION_BY_MIME[file.type]}`, file, PRODUCT_IMAGE_MAX_SIZE_MB);
}
