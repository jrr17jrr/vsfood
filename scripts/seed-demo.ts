/**
 * Seed idempotente dos grupos de opcionais/adicionais da loja demo oficial
 * do VSFood — evolui o cardápio já criado por `npm run seed` com exemplos
 * reais de cada modo de cobrança (sem custo, por opção, primeiras grátis,
 * mais cara, valor fixo), reaproveitando produtos que já existem.
 *
 * Idempotente: localiza grupos por product_id+name (cria se não existir,
 * atualiza se existir) e sempre reescreve as opções de cada grupo pro
 * conjunto desejado — rodar várias vezes produz o mesmo resultado final,
 * nunca duplica.
 *
 * Uso: npm run seed:demo
 * Requer .env.local preenchido (mesmas vars do `npm run seed`) e a loja demo
 * já criada (rode "npm run seed" antes, pelo menos uma vez).
 */
import { config } from "dotenv";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database, OptionGroupPricingMode } from "../types/database";

config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY em .env.local. Copie .env.example e preencha antes de rodar o seed.",
  );
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Localiza a loja demo oficial por `is_demo = true` (nunca por nome) — a
 * mais antiga, se houver mais de uma, mesmo critério de `lib/data/marketing.ts`.
 * Se nenhuma estiver marcada ainda, cai pro slug "dudu-burger" (criado pelo
 * seed principal) e a promove a `is_demo = true`, do mesmo jeito que o painel
 * admin faz ao ativar uma loja como demo — assim a próxima execução já acha
 * pelo caminho principal.
 */
async function findDemoRestaurant(): Promise<{ id: string; name: string }> {
  const { data: demo } = await supabase
    .from("restaurants")
    .select("id, name")
    .eq("is_demo", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (demo) return demo;

  console.warn('Nenhuma loja com is_demo=true — usando o slug "dudu-burger" como fallback.');
  const { data: bySlug } = await supabase.from("restaurants").select("id, name").eq("slug", "dudu-burger").maybeSingle();
  if (!bySlug) {
    throw new Error('Nenhuma loja demo encontrada (nem is_demo=true, nem slug "dudu-burger"). Rode "npm run seed" primeiro.');
  }

  await supabase.from("restaurants").update({ is_demo: true, access_type: "demo", status: "active" }).eq("id", bySlug.id);
  console.log(`✓ "${bySlug.name}" promovida a vitrine oficial (is_demo = true)`);
  return bySlug;
}

async function findProductId(restaurantId: string, name: string): Promise<string | null> {
  const { data } = await supabase
    .from("products")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("name", name)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

type OptionSpec = { name: string; price: number };
type GroupSpec = {
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  pricingMode: OptionGroupPricingMode;
  freeQuantity?: number;
  fixedPrice?: number;
  order: number;
  options: OptionSpec[];
};

/**
 * Cria o grupo se não existir (por product_id + name) ou atualiza os campos
 * se já existir; sempre reescreve as opções pro conjunto desejado. Seguro
 * reescrever as opções do zero: pedidos já feitos guardam snapshot do
 * nome/preço em order_item_options, não uma referência viva a product_options.
 */
async function upsertGroup(productId: string, spec: GroupSpec): Promise<void> {
  const { data: existing } = await supabase
    .from("product_option_groups")
    .select("id")
    .eq("product_id", productId)
    .eq("name", spec.name)
    .maybeSingle();

  const groupFields = {
    product_id: productId,
    name: spec.name,
    required: spec.required,
    min_select: spec.minSelect,
    max_select: spec.maxSelect,
    pricing_mode: spec.pricingMode,
    free_quantity: spec.freeQuantity ?? 0,
    fixed_price: spec.fixedPrice ?? 0,
    order: spec.order,
  };

  let groupId: string;
  if (existing) {
    groupId = existing.id;
    const { error } = await supabase.from("product_option_groups").update(groupFields).eq("id", groupId);
    if (error) throw error;
  } else {
    const { data: created, error } = await supabase.from("product_option_groups").insert(groupFields).select("id").single();
    if (error) throw error;
    groupId = created.id;
  }

  await supabase.from("product_options").delete().eq("group_id", groupId);
  if (spec.options.length > 0) {
    const { error } = await supabase
      .from("product_options")
      .insert(spec.options.map((o, index) => ({ group_id: groupId, name: o.name, price: o.price, available: true, order: index })));
    if (error) throw error;
  }

  console.log(`  ✓ ${spec.name} (${spec.pricingMode})`);
}

async function configureProduct(restaurantId: string, productName: string, groups: GroupSpec[]): Promise<void> {
  const productId = await findProductId(restaurantId, productName);
  if (!productId) {
    console.warn(`  ⚠ Produto "${productName}" não encontrado nesta loja — pulando.`);
    return;
  }
  console.log(`${productName}:`);
  for (const group of groups) {
    await upsertGroup(productId, group);
  }
}

async function main() {
  const restaurant = await findDemoRestaurant();
  console.log(`Configurando adicionais da demo em: ${restaurant.name}\n`);

  const pontoDaCarne: GroupSpec = {
    name: "Ponto da carne",
    required: true,
    minSelect: 1,
    maxSelect: 1,
    pricingMode: "no_charge",
    order: 0,
    options: [
      { name: "Mal passada", price: 0 },
      { name: "Ao ponto", price: 0 },
      { name: "Bem passada", price: 0 },
    ],
  };

  // Os 4 hambúrgueres do seed principal já têm "Ponto da carne" — só
  // normaliza a cobrança pra "sem custo" (o comportamento que já tinham).
  for (const name of ["X-Bacon", "X-Salada", "X-Cheddar", "X-Tudo"]) {
    await configureProduct(restaurant.id, name, [pontoDaCarne]);
  }

  // Dudu Clássico → obrigatório 1 de 1 (Ponto da carne, acima) + opcional
  // até 3 cobrando por opção.
  await configureProduct(restaurant.id, "X-Bacon", [
    {
      name: "Adicionais",
      required: false,
      minSelect: 0,
      maxSelect: 3,
      pricingMode: "per_option",
      order: 1,
      options: [
        { name: "Carne extra", price: 8 },
        { name: "Bacon extra", price: 5 },
        { name: "Cheddar extra", price: 4 },
        { name: "Onion rings", price: 4.5 },
      ],
    },
  ]);

  // Dudu Duplo → molhos opcionais até 2, primeira escolha grátis.
  await configureProduct(restaurant.id, "X-Tudo", [
    {
      name: "Molhos",
      required: false,
      minSelect: 0,
      maxSelect: 2,
      pricingMode: "free_first_n",
      freeQuantity: 1,
      order: 2,
      options: [
        { name: "Barbecue", price: 2 },
        { name: "Maionese da casa", price: 2 },
        { name: "Cheddar cremoso", price: 3 },
      ],
    },
  ]);

  // Combo Dudu → bebida obrigatória (sem custo) + turbine opcional por opção.
  await configureProduct(restaurant.id, "Combo Individual", [
    {
      name: "Escolha sua bebida",
      required: true,
      minSelect: 1,
      maxSelect: 1,
      pricingMode: "no_charge",
      order: 0,
      options: [
        { name: "Coca-Cola", price: 0 },
        { name: "Guaraná", price: 0 },
        { name: "Água", price: 0 },
      ],
    },
    {
      name: "Turbine seu combo",
      required: false,
      minSelect: 0,
      maxSelect: 2,
      pricingMode: "per_option",
      order: 1,
      options: [
        { name: "Batata grande", price: 4 },
        { name: "Bacon na batata", price: 5 },
        { name: "Cheddar na batata", price: 4 },
      ],
    },
  ]);

  // Combo Casal → os dois modos de cobrança que ainda faltavam demonstrar:
  // cobrar só a opção mais cara, e uma taxa fixa pra qualquer escolha válida.
  await configureProduct(restaurant.id, "Combo Casal", [
    {
      name: "Acompanhamento extra",
      required: false,
      minSelect: 0,
      maxSelect: 2,
      pricingMode: "highest_only",
      order: 0,
      options: [
        { name: "Batata rústica extra", price: 9 },
        { name: "Onion rings", price: 7 },
        { name: "Salada extra", price: 5 },
      ],
    },
    {
      name: "Bebidas especiais",
      required: false,
      minSelect: 0,
      maxSelect: 2,
      pricingMode: "fixed_price",
      fixedPrice: 6,
      order: 1,
      options: [
        { name: "Suco importado", price: 0 },
        { name: "Refrigerante premium", price: 0 },
        { name: "Água com gás", price: 0 },
      ],
    },
  ]);

  console.log("\nSeed da demo concluído.");
}

main().catch((err) => {
  console.error("Seed da demo falhou:", err);
  process.exit(1);
});
