/**
 * Seed do VSFood: cria a conta admin (a partir de env vars) e a loja de
 * demonstração "Dudu Burger" com cardápio completo, usada nas vendas
 * comerciais do produto.
 *
 * Uso: npm run seed
 * Requer .env.local preenchido com NEXT_PUBLIC_SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME.
 */
import { config } from "dotenv";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Administrador VSFood";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY em .env.local. Copie .env.example e preencha antes de rodar o seed.",
  );
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email: string) {
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function ensureUser(params: {
  email: string;
  password: string;
  name: string;
  role: "admin" | "restaurant_owner" | "customer";
  whatsapp?: string;
}) {
  const existing = await findUserByEmail(params.email);
  if (existing) {
    await supabase
      .from("profiles")
      .update({ role: params.role, name: params.name, whatsapp: params.whatsapp ?? null })
      .eq("id", existing.id);
    console.log(`✓ Usuário já existia: ${params.email}`);
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    user_metadata: { role: params.role, name: params.name, whatsapp: params.whatsapp },
  });
  if (error) throw error;
  console.log(`✓ Usuário criado: ${params.email}`);
  return data.user.id;
}

async function seedAdmin() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn("ADMIN_EMAIL/ADMIN_PASSWORD não definidos — pulando criação do admin.");
    return;
  }
  await ensureUser({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: ADMIN_NAME, role: "admin" });
}

const DEMO_OWNER_EMAIL = "dono@dudu-burger.vsfood.com.br";
const DEMO_OWNER_PASSWORD = "DuduBurger#2026";

async function seedDemoRestaurant() {
  const ownerId = await ensureUser({
    email: DEMO_OWNER_EMAIL,
    password: DEMO_OWNER_PASSWORD,
    name: "Dudu",
    whatsapp: "11988887777",
    role: "restaurant_owner",
  });

  const { data: existingRestaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", "dudu-burger")
    .maybeSingle();

  let restaurantId: string;

  if (existingRestaurant) {
    restaurantId = existingRestaurant.id;
    // limpa cardápio/config para reseed idempotente
    await supabase.from("categories").delete().eq("restaurant_id", restaurantId);
    await supabase.from("delivery_zones").delete().eq("restaurant_id", restaurantId);
    await supabase.from("opening_hours").delete().eq("restaurant_id", restaurantId);
    await supabase.from("coupons").delete().eq("restaurant_id", restaurantId);
    console.log("✓ Loja demo já existia, cardápio limpo para reseed");
  } else {
    const { data, error } = await supabase
      .from("restaurants")
      .insert({
        slug: "dudu-burger",
        name: "Dudu Burger",
        description: "Hambúrgueres artesanais, batatas rústicas e milk-shakes. O melhor smash burger da cidade.",
        cuisine_type: "Hambúrgueria",
        primary_color: "#F0631D",
        whatsapp: "11988887777",
        instagram: "duduburger",
        phone: "1130304040",
        cep: "01310-100",
        street: "Av. Paulista",
        number: "1000",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        status: "active",
        plan: "basic",
        min_order_value: 20,
        estimated_time_minutes: 35,
        logo_url: "https://loremflickr.com/200/200/burger,logo?lock=101",
        banner_url: "https://loremflickr.com/1200/400/burger,restaurant?lock=102",
      })
      .select("id")
      .single();
    if (error) throw error;
    restaurantId = data.id;
    console.log("✓ Loja demo criada: Dudu Burger");
  }

  await supabase
    .from("restaurant_users")
    .upsert({ restaurant_id: restaurantId, user_id: ownerId, role: "owner" }, { onConflict: "restaurant_id,user_id" });

  // horários: seg fechado, ter-dom 18h-23h30
  const hours = [2, 3, 4, 5, 6, 0].map((weekday) => ({
    restaurant_id: restaurantId,
    weekday,
    opens_at: "18:00",
    closes_at: "23:30",
  }));
  await supabase.from("opening_hours").insert(hours);

  await supabase.from("delivery_zones").insert([
    { restaurant_id: restaurantId, neighborhood: "Bela Vista", fee: 5 },
    { restaurant_id: restaurantId, neighborhood: "Consolação", fee: 7 },
    { restaurant_id: restaurantId, neighborhood: "Jardins", fee: 10 },
  ]);

  await supabase.from("coupons").insert([
    {
      restaurant_id: restaurantId,
      code: "BEMVINDO10",
      type: "percent",
      value: 10,
      min_order_value: 30,
      active: true,
    },
  ]);

  const categoriesSeed = [
    { name: "Hambúrgueres", order: 0 },
    { name: "Combos", order: 1 },
    { name: "Bebidas", order: 2 },
    { name: "Sobremesas", order: 3 },
  ];

  const categoryIds: Record<string, string> = {};
  for (const c of categoriesSeed) {
    const { data, error } = await supabase
      .from("categories")
      .insert({ restaurant_id: restaurantId, name: c.name, order: c.order })
      .select("id")
      .single();
    if (error) throw error;
    categoryIds[c.name] = data.id;
  }

  type ProductSeed = {
    category: string;
    name: string;
    description: string;
    price: number;
    promo_price?: number;
    image: string;
    featured?: boolean;
    hasBurgerOptions?: boolean;
  };

  const products: ProductSeed[] = [
    {
      category: "Hambúrgueres",
      name: "X-Bacon",
      description: "Pão brioche, blend 160g, queijo cheddar, bacon crocante e molho da casa.",
      price: 28.9,
      image: "https://loremflickr.com/600/400/bacon,burger?lock=1",
      featured: true,
      hasBurgerOptions: true,
    },
    {
      category: "Hambúrgueres",
      name: "X-Salada",
      description: "Pão brioche, blend 160g, queijo, alface, tomate e maionese da casa.",
      price: 24.9,
      image: "https://loremflickr.com/600/400/cheeseburger?lock=2",
      hasBurgerOptions: true,
    },
    {
      category: "Hambúrgueres",
      name: "X-Cheddar",
      description: "Pão brioche, blend 160g, dose dupla de cheddar cremoso.",
      price: 26.9,
      promo_price: 23.9,
      image: "https://loremflickr.com/600/400/cheddar,burger?lock=3",
      hasBurgerOptions: true,
    },
    {
      category: "Hambúrgueres",
      name: "X-Tudo",
      description: "Pão brioche, 2 blends 160g, bacon, ovo, queijo, presunto e milho.",
      price: 34.9,
      image: "https://loremflickr.com/600/400/burger,bigburger?lock=4",
      featured: true,
      hasBurgerOptions: true,
    },
    {
      category: "Combos",
      name: "Combo Casal",
      description: "2 X-Bacon + batata rústica grande + 2 refrigerantes lata.",
      price: 79.9,
      promo_price: 69.9,
      image: "https://loremflickr.com/600/400/burger,combo?lock=5",
      featured: true,
    },
    {
      category: "Combos",
      name: "Combo Individual",
      description: "1 hambúrguer à escolha + batata média + refrigerante lata.",
      price: 42.9,
      image: "https://loremflickr.com/600/400/mealcombo,fastfood?lock=6",
    },
    {
      category: "Bebidas",
      name: "Coca-Cola Lata",
      description: "350ml gelada.",
      price: 7.0,
      image: "https://loremflickr.com/600/400/soda,can?lock=7",
    },
    {
      category: "Bebidas",
      name: "Suco Natural",
      description: "Laranja ou limão, 500ml.",
      price: 9.9,
      image: "https://loremflickr.com/600/400/juice,glass?lock=8",
    },
    {
      category: "Bebidas",
      name: "Batata Frita",
      description: "Porção rústica com alecrim, 350g.",
      price: 18.9,
      image: "https://loremflickr.com/600/400/frenchfries?lock=9",
    },
    {
      category: "Sobremesas",
      name: "Milk-shake de Chocolate",
      description: "400ml, cremoso, com calda e chantilly.",
      price: 16.9,
      image: "https://loremflickr.com/600/400/milkshake,chocolate?lock=10",
    },
    {
      category: "Sobremesas",
      name: "Petit Gateau",
      description: "Com sorvete de creme.",
      price: 19.9,
      image: "https://loremflickr.com/600/400/dessert,chocolatecake?lock=11",
    },
  ];

  for (const [i, p] of products.entries()) {
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        restaurant_id: restaurantId,
        category_id: categoryIds[p.category],
        name: p.name,
        description: p.description,
        price: p.price,
        promo_price: p.promo_price ?? null,
        image_url: p.image,
        featured: p.featured ?? false,
        order: i,
      })
      .select("id")
      .single();
    if (error) throw error;

    if (p.hasBurgerOptions) {
      const { data: pontoGroup, error: pontoErr } = await supabase
        .from("product_option_groups")
        .insert({
          product_id: product.id,
          name: "Ponto da carne",
          required: true,
          min_select: 1,
          max_select: 1,
          order: 0,
        })
        .select("id")
        .single();
      if (pontoErr) throw pontoErr;

      await supabase.from("product_options").insert([
        { group_id: pontoGroup.id, name: "Mal passado", price: 0, order: 0 },
        { group_id: pontoGroup.id, name: "Ao ponto", price: 0, order: 1 },
        { group_id: pontoGroup.id, name: "Bem passado", price: 0, order: 2 },
      ]);

      const { data: adicionaisGroup, error: adErr } = await supabase
        .from("product_option_groups")
        .insert({
          product_id: product.id,
          name: "Adicionais",
          required: false,
          min_select: 0,
          max_select: 5,
          order: 1,
        })
        .select("id")
        .single();
      if (adErr) throw adErr;

      await supabase.from("product_options").insert([
        { group_id: adicionaisGroup.id, name: "Bacon", price: 4, order: 0 },
        { group_id: adicionaisGroup.id, name: "Cheddar", price: 3, order: 1 },
        { group_id: adicionaisGroup.id, name: "Molho especial", price: 2, order: 2 },
        { group_id: adicionaisGroup.id, name: "Cebola caramelizada", price: 3, order: 3 },
        { group_id: adicionaisGroup.id, name: "Ovo", price: 2, order: 4 },
      ]);
    }
  }

  console.log("✓ Cardápio demo (11 produtos) criado");
  console.log(`\nAcesso ao painel da loja demo:\n  E-mail: ${DEMO_OWNER_EMAIL}\n  Senha: ${DEMO_OWNER_PASSWORD}`);
}

async function main() {
  await seedAdmin();
  await seedDemoRestaurant();
  console.log("\nSeed concluído.");
}

main().catch((err) => {
  console.error("Seed falhou:", err);
  process.exit(1);
});
