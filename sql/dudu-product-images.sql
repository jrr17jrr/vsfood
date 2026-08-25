-- VSFood / Dudu Burger — corrige a foto da Coca-Cola no cardápio da loja demo.
--
-- ============================================================================
-- Auditoria do schema real (antes de qualquer suposição de nome de tabela):
--   - supabase/migrations/20260822000002_tables.sql → `create table if not
--     exists restaurants (... slug text not null unique ...)` e
--     `create table if not exists products (... restaurant_id, name,
--     image_url ...)`, ambas no schema `public` (sem schema customizado em
--     nenhuma migration do projeto).
--   - types/database.ts → `Database["public"]["Tables"]` declara
--     exatamente `restaurants` e `products` como chaves.
--   - lib/data/storefront.ts e lib/data/marketing.ts → todo o app consulta
--     `supabase.from("restaurants")` / `supabase.from("products")`.
--   - scripts/dudu-burger-demo.sql (script irmão, equivalente SQL do
--     `npm run seed:demo`, feito pra rodar direto no SQL Editor) usa os
--     mesmos nomes sem qualificação (`FROM products`, `FROM restaurants`)
--     como referência de que a conexão de quem roda esse tipo de script
--     enxerga essas tabelas normalmente.
--   - Conclusão: não existe outro nome real de tabela no projeto — o
--     schema é `public.restaurants` / `public.products`, com colunas
--     `slug` e `image_url` respectivamente. Este script agora qualifica
--     tudo com `public.` (elimina qualquer ambiguidade de search_path) e
--     falha com uma mensagem clara em vez do erro genérico do Postgres
--     caso essas tabelas realmente não existam na conexão usada — o que
--     indicaria estar no projeto/branch errado do Supabase, não um nome
--     de tabela errado no código.
--
-- Escopo do fix: só a foto da "Coca-Cola" da loja marcada como demo
-- (is_demo = true, com fallback pelo slug "dudu-burger" — mesmo critério
-- de lib/data/marketing.ts:getDemoRestaurant()). Não mexe em nome, preço,
-- categoria, descrição, nem em outros produtos.
--
-- Nome do produto casado com ILIKE (não igualdade exata) porque as
-- diferentes fontes de seed do projeto usam grafias levemente diferentes
-- ("Coca-Cola Lata" em scripts/seed.ts vs "Coca-Cola Lata 350ml" citado
-- pelo usuário) — ILIKE 'coca-cola%' cobre as duas sem risco de casar
-- outro produto (só há uma bebida de cola no cardápio da demo).
--
-- Idempotente: UPDATE por nome, nunca INSERT — seguro rodar quantas vezes
-- quiser, sempre produz o mesmo resultado.
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.restaurants') IS NULL THEN
    RAISE EXCEPTION 'Tabela public.restaurants não encontrada nesta conexão. As tabelas do VSFood são criadas em supabase/migrations/20260822000002_tables.sql — confirme que você está rodando este script no projeto/branch correto do Supabase (não é um nome de tabela errado no script).';
  END IF;
  IF to_regclass('public.products') IS NULL THEN
    RAISE EXCEPTION 'Tabela public.products não encontrada nesta conexão. As tabelas do VSFood são criadas em supabase/migrations/20260822000002_tables.sql — confirme que você está rodando este script no projeto/branch correto do Supabase (não é um nome de tabela errado no script).';
  END IF;
END $$;

UPDATE public.products
SET image_url = 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=1200&q=85'
WHERE name ILIKE 'coca-cola%'
  AND restaurant_id = COALESCE(
    (SELECT id FROM public.restaurants WHERE is_demo = true ORDER BY created_at ASC LIMIT 1),
    (SELECT id FROM public.restaurants WHERE slug = 'dudu-burger' LIMIT 1)
  );

-- ============================================================================
-- SELECT de conferência — todos os produtos da loja demo e a imagem atual
-- de cada um, pra você validar visualmente (não só a Coca-Cola).
-- ============================================================================
SELECT
  p.name AS produto,
  p.image_url
FROM public.products p
JOIN public.restaurants r ON r.id = p.restaurant_id
WHERE r.id = COALESCE(
  (SELECT id FROM public.restaurants WHERE is_demo = true ORDER BY created_at ASC LIMIT 1),
  (SELECT id FROM public.restaurants WHERE slug = 'dudu-burger' LIMIT 1)
)
ORDER BY p.name;
