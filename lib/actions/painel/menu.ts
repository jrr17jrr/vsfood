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
    unlimited_stock: parsed.data.unlimitedStock,
    stock_quantity: parsed.data.stockQuantity,
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
      unlimited_stock: parsed.data.unlimitedStock,
      stock_quantity: parsed.data.stockQuantity,
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
    pricing_mode: parsed.data.pricingMode,
    free_quantity: parsed.data.freeQuantity,
    fixed_price: parsed.data.fixedPrice,
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
      pricing_mode: parsed.data.pricingMode,
      free_quantity: parsed.data.freeQuantity,
      fixed_price: parsed.data.fixedPrice,
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

export async function reorderOptionGroupAction(id: string, direction: "up" | "down"): Promise<Result> {
  await requireRestaurantMembership();
  const supabase = await createClient();
  const { data: group } = await supabase.from("product_option_groups").select("id, product_id").eq("id", id).maybeSingle();
  if (!group) return {};

  const { data: groups } = await supabase
    .from("product_option_groups")
    .select("id, order")
    .eq("product_id", group.product_id)
    .order("order");

  if (!groups) return {};
  const index = groups.findIndex((g) => g.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= groups.length) return {};

  const a = groups[index];
  const b = groups[swapWith];
  await Promise.all([
    supabase.from("product_option_groups").update({ order: b.order }).eq("id", a.id),
    supabase.from("product_option_groups").update({ order: a.order }).eq("id", b.id),
  ]);

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

// --- duplicação ---------------------------------------------------------

/**
 * Duplica produto + grupos de adicionais + opções, tudo com IDs novos.
 * A cópia inteira roda dentro de uma única function no banco (transação
 * atômica) — ver supabase/migrations/20260826000002_duplicate_menu_rpc.sql.
 */
export async function duplicateProductAction(id: string): Promise<Result> {
  const { restaurantId } = await requireRestaurantMembership();
  const supabase = await createClient();
  const { error } = await supabase.rpc("duplicate_product", { p_product_id: id, p_restaurant_id: restaurantId });
  if (error) return { error: "Não foi possível duplicar o produto." };
  revalidateMenu();
  return {};
}

/** Duplica a categoria e todos os produtos (com adicionais/opções) dela — mesma lógica atômica do produto. */
export async function duplicateCategoryAction(id: string): Promise<Result> {
  const { restaurantId } = await requireRestaurantMembership();
  const supabase = await createClient();
  const { error } = await supabase.rpc("duplicate_category", { p_category_id: id, p_restaurant_id: restaurantId });
  if (error) return { error: "Não foi possível duplicar a categoria." };
  revalidateMenu();
  return {};
}

// --- estoque --------------------------------------------------------------

/** Atalho da listagem: zera o estoque sem precisar abrir o modal de edição. Só faz sentido pra produto de estoque limitado. */
export async function markProductSoldOutAction(id: string): Promise<Result> {
  await requireRestaurantMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ stock_quantity: 0 }).eq("id", id);
  if (error) return { error: "Não foi possível marcar como esgotado." };
  revalidateMenu();
  return {};
}

// --- reorder em lote (drag-and-drop) ---------------------------------------
// Reaproveita o mesmo campo "order" e o mesmo revalidateMenu() das ações de
// subir/descer acima — só troca a troca de par adjacente por "aplica o
// índice de cada id na nova ordem completa", que é o que o drag-and-drop
// solto pelo usuário produz. As setas de subir/descer continuam existindo
// como fallback de acessibilidade.

export async function reorderCategoriesAction(orderedIds: string[]): Promise<Result> {
  const { restaurantId } = await requireRestaurantMembership();
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("categories").update({ order: index }).eq("id", id).eq("restaurant_id", restaurantId),
    ),
  );
  revalidateMenu();
  return {};
}

export async function reorderProductsAction(categoryId: string, orderedIds: string[]): Promise<Result> {
  const { restaurantId } = await requireRestaurantMembership();
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("products")
        .update({ order: index })
        .eq("id", id)
        .eq("restaurant_id", restaurantId)
        .eq("category_id", categoryId),
    ),
  );
  revalidateMenu();
  return {};
}

export async function reorderOptionGroupsBulkAction(productId: string, orderedIds: string[]): Promise<Result> {
  await requireRestaurantMembership();
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("product_option_groups").update({ order: index }).eq("id", id).eq("product_id", productId),
    ),
  );
  revalidateMenu();
  return {};
}

export async function reorderOptionsBulkAction(groupId: string, orderedIds: string[]): Promise<Result> {
  await requireRestaurantMembership();
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("product_options").update({ order: index }).eq("id", id).eq("group_id", groupId),
    ),
  );
  revalidateMenu();
  return {};
}
