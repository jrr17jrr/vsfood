"use client";

import { createClient } from "@/lib/supabase/client";

const BUCKET = "restaurants";

function extensionOf(file: File): string {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "jpg";
}

async function uploadAndGetUrl(path: string, file: File): Promise<string> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function uploadRestaurantLogo(restaurantId: string, file: File): Promise<string> {
  return uploadAndGetUrl(`${restaurantId}/logo.${extensionOf(file)}`, file);
}

export async function uploadRestaurantBanner(restaurantId: string, file: File): Promise<string> {
  return uploadAndGetUrl(`${restaurantId}/banner.${extensionOf(file)}`, file);
}

export async function uploadProductImage(restaurantId: string, file: File): Promise<string> {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
  return uploadAndGetUrl(`${restaurantId}/products/${id}.${extensionOf(file)}`, file);
}
