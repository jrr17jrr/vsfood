"use server";

import { revalidatePath } from "next/cache";
import { requireRestaurantMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  categoryInputSchema,
  optionGroupInputSchema,
  optionInputSchema,
  productInputSchema,
  type CategoryInput,
  type OptionGroupInput,
  type OptionInput,
  type ProductInput,
} from "@/lib/validations/menu";

type Result = { error?: string };

function revalidateMenu() {
  revalidatePath("/painel/cardapio");
  revalidatePath("/loja", "layout");
}

// --- categorias -------------------------------------------------------------

export async function createCategoryAction(input: CategoryInput): Promise<Result> {
  const { restaurantId } = await requireRestaurantMembership();
  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId);

  const { error } = await supabase
    .from("categories")
    .insert({ restaurant_id: restaurantId, name: parsed.data.name, order: count ?? 0 });

  if (error) return { error: "Não foi possível criar a categoria." };
  revalidateMenu();
  return {};
}

export async function updateCategoryAction(
  id: string,
  input: Partial<CategoryInput & { active: boolean }>,
): Promise<Result> {
  await requireRestaurantMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update(input).eq("id", id);
  if (error) return { error: "Não foi possível atualizar a categoria." };
  revalidateMenu();
  return {};
}

export async function deleteCategoryAction(id: string): Promise<Result> {
  await requireRestaurantMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir a categoria." };
  revalidateMenu();
  return {};
}

export async function reorderCategoryAction(id: string, direction: "up" | "down"): Promise<Result> {
  const { restaurantId } = await requireRestaurantMembership();
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, order")
    .eq("restaurant_id", restaurantId)
    .order("order");

  if (!categories) return {};
  const index = categories.findIndex((c) => c.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= categories.length) return {};

  const a = categories[index];
  const b = categories[swapWith];
  await Promise.all([
    supabase.from("categories").update({ order: b.order }).eq("id", a.id),
    supabase.from("categories").update({ order: a.order }).eq("id", b.id),
  ]);

  revalidateMenu();
  return {};
}

// --- produtos ---------------------------------------------------------------

export async function createProductAction(input: ProductInput): Promise<Result> {
  const { restaurantId } = await requireRestaurantMembership();
  const parsed = productInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId);

  const { error } = await supabase.from("products").insert({
    restaurant_id: restaurantId,
    category_id: parsed.data.categoryId || null,
    name: parsed.data.name,
    description: parsed.data.description || null,
    price: parsed.data.price,
    promo_price: parsed.data.promoPrice || null,
    image_url: parsed.data.imageUrl || null,
    available: parsed.data.available,
    featured: parsed.data.featured,
    order: count ?? 0,
  });

  if (error) return { error: "Não foi possível criar o produto." };
  revalidateMenu();
  return {};
}

export async function updateProductAction(id: string, input: ProductInput): Promise<Result> {
  await requireRestaurantMembership();
  const parsed = productInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      category_id: parsed.data.categoryId || null,
      name: parsed.data.name,
      description: parsed.data.description || null,
      price: parsed.data.price,
      promo_price: parsed.data.promoPrice || null,
      image_url: parsed.data.imageUrl || null,
      available: parsed.data.available,
      featured: parsed.data.featured,
    })
    .eq("id", id);

  if (error) return { error: "Não foi possível atualizar o produto." };
  revalidateMenu();
  return {};
}

export async function toggleProductAvailableAction(id: string, available: boolean): Promise<Result> {
  await requireRestaurantMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ available }).eq("id", id);
  if (error) return { error: "Não foi possível atualizar o produto." };
  revalidateMenu();
  return {};
}

export async function deleteProductAction(id: string): Promise<Result> {
  await requireRestaurantMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir o produto." };
  revalidateMenu();
  return {};
}

// --- grupos de adicionais -----------------------------------------------

export async function createOptionGroupAction(productId: string, input: OptionGroupInput): Promise<Result> {
  await requireRestaurantMembership();
  const parsed = optionGroupInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { count } = await supabase
    .from("product_option_groups")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const { error } = await supabase.from("product_option_groups").insert({
    product_id: productId,
    name: parsed.data.name,
    required: parsed.data.required,
    min_select: parsed.data.minSelect,
    max_select: parsed.data.maxSelect,
    order: count ?? 0,
  });

  if (error) return { error: "Não foi possível criar o grupo de adicionais." };
  revalidateMenu();
  return {};
}

export async function updateOptionGroupAction(id: string, input: OptionGroupInput): Promise<Result> {
  await requireRestaurantMembership();
  const parsed = optionGroupInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("product_option_groups")
    .update({
      name: parsed.data.name,
      required: parsed.data.required,
      min_select: parsed.data.minSelect,
      max_select: parsed.data.maxSelect,
    })
    .eq("id", id);

  if (error) return { error: "Não foi possível atualizar o grupo." };
  revalidateMenu();
  return {};
}

export async function deleteOptionGroupAction(id: string): Promise<Result> {
  await requireRestaurantMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("product_option_groups").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir o grupo." };
  revalidateMenu();
  return {};
}

// --- opções -----------------------------------------------------------------

export async function createOptionAction(groupId: string, input: OptionInput): Promise<Result> {
  await requireRestaurantMembership();
  const parsed = optionInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { count } = await supabase
    .from("product_options")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId);

  const { error } = await supabase.from("product_options").insert({
    group_id: groupId,
    name: parsed.data.name,
    price: parsed.data.price,
    available: parsed.data.available,
    order: count ?? 0,
  });

  if (error) return { error: "Não foi possível criar o adicional." };
  revalidateMenu();
  return {};
}

export async function updateOptionAction(id: string, input: OptionInput): Promise<Result> {
  await requireRestaurantMembership();
  const parsed = optionInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("product_options")
    .update({ name: parsed.data.name, price: parsed.data.price, available: parsed.data.available })
    .eq("id", id);

  if (error) return { error: "Não foi possível atualizar o adicional." };
  revalidateMenu();
  return {};
}

export async function deleteOptionAction(id: string): Promise<Result> {
  await requireRestaurantMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("product_options").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir o adicional." };
  revalidateMenu();
  return {};
}
