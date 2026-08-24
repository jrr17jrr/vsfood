-- =============================================================================
-- VSFood — configura os grupos/opções de demonstração na Dudu Burger existente
--
-- Equivalente em SQL puro de scripts/seed-demo.ts, pra rodar direto no
-- SQL Editor do Supabase (sem Node/npm/.env.local). Requer que a migration
-- supabase/migrations/20260825000001_option_group_pricing.sql já tenha sido
-- aplicada (é de lá que vêm o enum option_group_pricing_mode e as colunas
-- pricing_mode/free_quantity/fixed_price em product_option_groups).
--
-- NÃO cria restaurante, NÃO cria usuário, NÃO apaga produtos.
-- Só cria/atualiza product_option_groups e product_options dos produtos:
-- X-Bacon, X-Salada, X-Cheddar, X-Tudo, Combo Individual, Combo Casal.
--
-- Idempotente: cada grupo é localizado por (product_id, name) — se existir,
-- atualiza os campos; se não existir, cria. As opções de cada grupo são
-- sempre substituídas pelo conjunto desejado (delete + insert), igual ao
-- upsertGroup() do seed-demo.ts — seguro porque pedidos já feitos guardam
-- snapshot do nome/preço em order_item_options, não uma referência viva a
-- product_options. Rodar este script várias vezes produz sempre o mesmo
-- resultado final, sem duplicar nada.
--
-- Se algum dos produtos esperados não existir na loja localizada, o script
-- emite um RAISE NOTICE e pula só aquele produto — os demais grupos/opções
-- continuam sendo configurados normalmente.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.upsert_option_group(
  p_product_id uuid,
  p_name text,
  p_required boolean,
  p_min_select int,
  p_max_select int,
  p_pricing_mode option_group_pricing_mode,
  p_free_quantity int,
  p_fixed_price numeric,
  p_order int,
  p_options jsonb
) RETURNS void AS $$
DECLARE
  v_group_id uuid;
BEGIN
  SELECT id INTO v_group_id
  FROM product_option_groups
  WHERE product_id = p_product_id AND name = p_name;

  IF v_group_id IS NULL THEN
    INSERT INTO product_option_groups
      (product_id, name, required, min_select, max_select, pricing_mode, free_quantity, fixed_price, "order")
    VALUES
      (p_product_id, p_name, p_required, p_min_select, p_max_select, p_pricing_mode, p_free_quantity, p_fixed_price, p_order)
    RETURNING id INTO v_group_id;
  ELSE
    UPDATE product_option_groups
    SET required = p_required,
        min_select = p_min_select,
        max_select = p_max_select,
        pricing_mode = p_pricing_mode,
        free_quantity = p_free_quantity,
        fixed_price = p_fixed_price,
        "order" = p_order
    WHERE id = v_group_id;
  END IF;

  DELETE FROM product_options WHERE group_id = v_group_id;

  INSERT INTO product_options (group_id, name, price, available, "order")
  SELECT v_group_id, (elem->>'name'), (elem->>'price')::numeric, true, idx - 1
  FROM jsonb_array_elements(p_options) WITH ORDINALITY AS t(elem, idx);

  RAISE NOTICE '  - % (%)', p_name, p_pricing_mode;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  v_restaurant_id uuid;
  v_restaurant_name text;
  v_product_id uuid;
  v_burger_name text;
BEGIN
  SELECT id, name INTO v_restaurant_id, v_restaurant_name
  FROM restaurants
  WHERE is_demo = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_restaurant_id IS NULL THEN
    RAISE NOTICE 'Nenhuma loja com is_demo=true - usando o slug dudu-burger como fallback.';

    SELECT id, name INTO v_restaurant_id, v_restaurant_name
    FROM restaurants
    WHERE slug = 'dudu-burger'
    LIMIT 1;

    IF v_restaurant_id IS NULL THEN
      RAISE EXCEPTION 'Nenhuma loja demo encontrada (nem is_demo=true, nem slug dudu-burger). Rode o seed principal primeiro.';
    END IF;

    UPDATE restaurants SET is_demo = true, access_type = 'demo', status = 'active' WHERE id = v_restaurant_id;
    RAISE NOTICE 'Loja % promovida a vitrine oficial (is_demo = true).', v_restaurant_name;
  END IF;

  RAISE NOTICE 'Configurando adicionais da demo em: %', v_restaurant_name;

  FOREACH v_burger_name IN ARRAY ARRAY['X-Bacon', 'X-Salada', 'X-Cheddar', 'X-Tudo']
  LOOP
    SELECT id INTO v_product_id
    FROM products
    WHERE restaurant_id = v_restaurant_id AND name = v_burger_name
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_product_id IS NULL THEN
      RAISE NOTICE 'Produto % nao encontrado nesta loja - pulando.', v_burger_name;
    ELSE
      PERFORM pg_temp.upsert_option_group(
        v_product_id, 'Ponto da carne', true, 1, 1, 'no_charge'::option_group_pricing_mode, 0, 0, 0,
        '[{"name":"Mal passada","price":0},{"name":"Ao ponto","price":0},{"name":"Bem passada","price":0}]'::jsonb
      );
    END IF;
  END LOOP;

  SELECT id INTO v_product_id FROM products WHERE restaurant_id = v_restaurant_id AND name = 'X-Bacon' ORDER BY created_at ASC LIMIT 1;
  IF v_product_id IS NULL THEN
    RAISE NOTICE 'Produto X-Bacon nao encontrado nesta loja - pulando "Adicionais".';
  ELSE
    PERFORM pg_temp.upsert_option_group(
      v_product_id, 'Adicionais', false, 0, 3, 'per_option'::option_group_pricing_mode, 0, 0, 1,
      '[{"name":"Carne extra","price":8},{"name":"Bacon extra","price":5},{"name":"Cheddar extra","price":4},{"name":"Onion rings","price":4.5}]'::jsonb
    );
  END IF;

  SELECT id INTO v_product_id FROM products WHERE restaurant_id = v_restaurant_id AND name = 'X-Tudo' ORDER BY created_at ASC LIMIT 1;
  IF v_product_id IS NULL THEN
    RAISE NOTICE 'Produto X-Tudo nao encontrado nesta loja - pulando "Molhos".';
  ELSE
    PERFORM pg_temp.upsert_option_group(
      v_product_id, 'Molhos', false, 0, 2, 'free_first_n'::option_group_pricing_mode, 1, 0, 2,
      '[{"name":"Barbecue","price":2},{"name":"Maionese da casa","price":2},{"name":"Cheddar cremoso","price":3}]'::jsonb
    );
  END IF;

  SELECT id INTO v_product_id FROM products WHERE restaurant_id = v_restaurant_id AND name = 'Combo Individual' ORDER BY created_at ASC LIMIT 1;
  IF v_product_id IS NULL THEN
    RAISE NOTICE 'Produto Combo Individual nao encontrado nesta loja - pulando seus grupos.';
  ELSE
    PERFORM pg_temp.upsert_option_group(
      v_product_id, 'Escolha sua bebida', true, 1, 1, 'no_charge'::option_group_pricing_mode, 0, 0, 0,
      '[{"name":"Coca-Cola","price":0},{"name":"Guaraná","price":0},{"name":"Água","price":0}]'::jsonb
    );
    PERFORM pg_temp.upsert_option_group(
      v_product_id, 'Turbine seu combo', false, 0, 2, 'per_option'::option_group_pricing_mode, 0, 0, 1,
      '[{"name":"Batata grande","price":4},{"name":"Bacon na batata","price":5},{"name":"Cheddar na batata","price":4}]'::jsonb
    );
  END IF;

  SELECT id INTO v_product_id FROM products WHERE restaurant_id = v_restaurant_id AND name = 'Combo Casal' ORDER BY created_at ASC LIMIT 1;
  IF v_product_id IS NULL THEN
    RAISE NOTICE 'Produto Combo Casal nao encontrado nesta loja - pulando seus grupos.';
  ELSE
    PERFORM pg_temp.upsert_option_group(
      v_product_id, 'Acompanhamento extra', false, 0, 2, 'highest_only'::option_group_pricing_mode, 0, 0, 0,
      '[{"name":"Batata rústica extra","price":9},{"name":"Onion rings","price":7},{"name":"Salada extra","price":5}]'::jsonb
    );
    PERFORM pg_temp.upsert_option_group(
      v_product_id, 'Bebidas especiais', false, 0, 2, 'fixed_price'::option_group_pricing_mode, 0, 6, 1,
      '[{"name":"Suco importado","price":0},{"name":"Refrigerante premium","price":0},{"name":"Água com gás","price":0}]'::jsonb
    );
  END IF;

  RAISE NOTICE 'Seed da demo concluido.';
END $$;

DROP FUNCTION IF EXISTS pg_temp.upsert_option_group(uuid, text, boolean, int, int, option_group_pricing_mode, int, numeric, int, jsonb);

COMMIT;

-- =============================================================================
-- SELECT de conferência — produto, grupo, obrigatório, mínimo, máximo,
-- cobrança, quantidade grátis, valor fixo, opção e preço.
-- =============================================================================
SELECT
  p.name AS produto,
  g.name AS grupo,
  g.required AS obrigatorio,
  g.min_select AS minimo,
  g.max_select AS maximo,
  g.pricing_mode AS cobranca,
  g.free_quantity AS qtd_gratis,
  g.fixed_price AS valor_fixo,
  o.name AS opcao,
  o.price AS preco_opcao
FROM product_option_groups g
JOIN products p ON p.id = g.product_id
JOIN (
  VALUES
    ('X-Bacon', 'Ponto da carne'),
    ('X-Bacon', 'Adicionais'),
    ('X-Salada', 'Ponto da carne'),
    ('X-Cheddar', 'Ponto da carne'),
    ('X-Tudo', 'Ponto da carne'),
    ('X-Tudo', 'Molhos'),
    ('Combo Individual', 'Escolha sua bebida'),
    ('Combo Individual', 'Turbine seu combo'),
    ('Combo Casal', 'Acompanhamento extra'),
    ('Combo Casal', 'Bebidas especiais')
) AS expected(product_name, group_name) ON expected.product_name = p.name AND expected.group_name = g.name
LEFT JOIN product_options o ON o.group_id = g.id
ORDER BY p.name, g."order", o."order";
