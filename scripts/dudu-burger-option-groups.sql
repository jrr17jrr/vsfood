-- VSFood — Dudu Burger: completa os grupos de opcionais/adicionais dos
-- hambúrgueres, combos e porções, usando os produtos e IDs REAIS já
-- cadastrados (levantados na página pública /loja/dudu-burguer).
--
-- Restaurante afetado: só Dudu Burger. Categorias Bebidas e Sobremesas: não
-- tocadas. Preços base, imagens e estoque dos produtos: não tocados.
--
-- IMPORTANTE: rode este script UMA ÚNICA VEZ. Rodar de novo duplica todos
-- os grupos/opções abaixo (não tem guarda de idempotência de propósito,
-- pra manter o script simples e legível de ponta a ponta).
--
-- Como rodar: Supabase Dashboard > SQL Editor > colar e executar.

begin;

-- ============================================================
-- HAMBÚRGUERES
-- ============================================================

-- Dudu Clássico (R$27,90) — cheddar, alface, tomate, cebola roxa, molho especial
with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('30de6643-b193-4dad-9c93-6ba245562599', 'Ponto da carne', true, 1, 1, 'no_charge', 1)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Mal passada', 0, 1),
  ('Ao ponto', 0, 2),
  ('Bem passada', 0, 3)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('30de6643-b193-4dad-9c93-6ba245562599', 'Retirar ingredientes', false, 0, 5, 'no_charge', 2)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Sem cheddar', 0, 1),
  ('Sem alface', 0, 2),
  ('Sem tomate', 0, 3),
  ('Sem cebola roxa', 0, 4),
  ('Sem molho especial', 0, 5)
) as x(name, price, ord);

update product_option_groups set "order" = 3 where id = 'de8c3d34-b3c8-4f42-9cd0-48c354300a10'; -- "Adicionais" já existente

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('30de6643-b193-4dad-9c93-6ba245562599', 'Quer acompanhamento?', false, 0, 1, 'per_option', 4)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Batata frita individual', 7.00, 1)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('30de6643-b193-4dad-9c93-6ba245562599', 'Molhos extras', false, 0, 2, 'per_option', 5)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Maionese temperada', 2.00, 1),
  ('Molho especial', 2.00, 2),
  ('Barbecue', 2.00, 3)
) as x(name, price, ord);


-- Dudu Bacon (R$32,90) — cheddar cremoso, bacon crocante, cebola caramelizada, molho Dudu
with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('00b8d54e-5d77-4c88-b864-ce7b677cff6e', 'Ponto da carne', true, 1, 1, 'no_charge', 1)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Mal passada', 0, 1),
  ('Ao ponto', 0, 2),
  ('Bem passada', 0, 3)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('00b8d54e-5d77-4c88-b864-ce7b677cff6e', 'Retirar ingredientes', false, 0, 4, 'no_charge', 2)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Sem cheddar', 0, 1),
  ('Sem bacon', 0, 2),
  ('Sem cebola caramelizada', 0, 3),
  ('Sem molho Dudu', 0, 4)
) as x(name, price, ord);

update product_option_groups set "order" = 3 where id = '7ccad673-85de-40ee-901b-e52635bda0e5'; -- "Turbine seu burger" já existente

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('00b8d54e-5d77-4c88-b864-ce7b677cff6e', 'Quer acompanhamento?', false, 0, 1, 'per_option', 4)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Batata frita individual', 7.00, 1)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('00b8d54e-5d77-4c88-b864-ce7b677cff6e', 'Molhos extras', false, 0, 2, 'per_option', 5)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Maionese temperada', 2.00, 1),
  ('Molho especial', 2.00, 2),
  ('Barbecue', 2.00, 3)
) as x(name, price, ord);


-- Dudu Bacon (Cópia) (R$32,90) — mesmo produto, tratado igual ao Dudu Bacon
with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('a21b479c-b164-45dd-b2c8-e5b5bef1961a', 'Ponto da carne', true, 1, 1, 'no_charge', 1)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Mal passada', 0, 1),
  ('Ao ponto', 0, 2),
  ('Bem passada', 0, 3)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('a21b479c-b164-45dd-b2c8-e5b5bef1961a', 'Retirar ingredientes', false, 0, 4, 'no_charge', 2)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Sem cheddar', 0, 1),
  ('Sem bacon', 0, 2),
  ('Sem cebola caramelizada', 0, 3),
  ('Sem molho Dudu', 0, 4)
) as x(name, price, ord);

update product_option_groups set "order" = 3 where id = 'c6c64ca3-a013-4fbc-bb05-7e5b8c54378e'; -- "Turbine seu burger" já existente

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('a21b479c-b164-45dd-b2c8-e5b5bef1961a', 'Quer acompanhamento?', false, 0, 1, 'per_option', 4)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Batata frita individual', 7.00, 1)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('a21b479c-b164-45dd-b2c8-e5b5bef1961a', 'Molhos extras', false, 0, 2, 'per_option', 5)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Maionese temperada', 2.00, 1),
  ('Molho especial', 2.00, 2),
  ('Barbecue', 2.00, 3)
) as x(name, price, ord);


-- Dudu Duplo (R$39,90) — 2 carnes, cheddar em dobro, bacon, picles, cebola roxa, molho especial
with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('4b07ee53-33d1-4856-9111-0e0f05f0fa9f', 'Ponto da carne', true, 1, 1, 'no_charge', 1)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Mal passada', 0, 1),
  ('Ao ponto', 0, 2),
  ('Bem passada', 0, 3)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('4b07ee53-33d1-4856-9111-0e0f05f0fa9f', 'Retirar ingredientes', false, 0, 4, 'no_charge', 2)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Sem bacon', 0, 1),
  ('Sem picles', 0, 2),
  ('Sem cebola roxa', 0, 3),
  ('Sem molho especial', 0, 4)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('4b07ee53-33d1-4856-9111-0e0f05f0fa9f', 'Adicionais', false, 0, 4, 'per_option', 3)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Carne extra', 8.00, 1),
  ('Bacon extra', 5.00, 2),
  ('Cheddar extra', 4.00, 3)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('4b07ee53-33d1-4856-9111-0e0f05f0fa9f', 'Quer acompanhamento?', false, 0, 1, 'per_option', 4)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Batata frita individual', 7.00, 1)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('4b07ee53-33d1-4856-9111-0e0f05f0fa9f', 'Molhos extras', false, 0, 2, 'per_option', 5)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Maionese temperada', 2.00, 1),
  ('Molho especial', 2.00, 2),
  ('Barbecue', 2.00, 3)
) as x(name, price, ord);


-- Dudu Monstro (R$49,90) — 3 carnes, muito cheddar, bacon, onion rings, molho barbecue
with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('2718eba1-4275-4553-bee5-f8b145c146cb', 'Ponto da carne', true, 1, 1, 'no_charge', 1)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Mal passada', 0, 1),
  ('Ao ponto', 0, 2),
  ('Bem passada', 0, 3)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('2718eba1-4275-4553-bee5-f8b145c146cb', 'Retirar ingredientes', false, 0, 3, 'no_charge', 2)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Sem bacon', 0, 1),
  ('Sem onion rings', 0, 2),
  ('Sem molho barbecue', 0, 3)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('2718eba1-4275-4553-bee5-f8b145c146cb', 'Adicionais', false, 0, 4, 'per_option', 3)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Carne extra', 8.00, 1),
  ('Bacon extra', 5.00, 2),
  ('Cheddar extra', 4.00, 3)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('2718eba1-4275-4553-bee5-f8b145c146cb', 'Quer acompanhamento?', false, 0, 1, 'per_option', 4)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Batata frita individual', 7.00, 1)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('2718eba1-4275-4553-bee5-f8b145c146cb', 'Molhos extras', false, 0, 2, 'per_option', 5)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Maionese temperada', 2.00, 1),
  ('Molho especial', 2.00, 2),
  ('Barbecue', 2.00, 3)
) as x(name, price, ord);


-- Dudu Chicken (R$28,90) — frango empanado, queijo, alface, tomate, maionese especial
-- Sem grupo "Ponto da carne": é frango empanado, não carne bovina.
with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('8452efc7-04c3-4009-b94d-bcbbe5c85fa6', 'Retirar ingredientes', false, 0, 4, 'no_charge', 1)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Sem queijo', 0, 1),
  ('Sem alface', 0, 2),
  ('Sem tomate', 0, 3),
  ('Sem maionese especial', 0, 4)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('8452efc7-04c3-4009-b94d-bcbbe5c85fa6', 'Adicionais', false, 0, 4, 'per_option', 2)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Bacon extra', 5.00, 1),
  ('Cheddar extra', 4.00, 2),
  ('Ovo', 2.50, 3)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('8452efc7-04c3-4009-b94d-bcbbe5c85fa6', 'Quer acompanhamento?', false, 0, 1, 'per_option', 3)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Batata frita individual', 7.00, 1)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('8452efc7-04c3-4009-b94d-bcbbe5c85fa6', 'Molhos extras', false, 0, 2, 'per_option', 4)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Maionese temperada', 2.00, 1),
  ('Molho especial', 2.00, 2),
  ('Barbecue', 2.00, 3)
) as x(name, price, ord);


-- ============================================================
-- COMBOS
-- ============================================================

-- Combo Dudu Clássico (R$39,90) — "Escolha sua bebida" já existe (order 1, mantido). Só adiciona:
update product_option_groups set "order" = 1 where id = '9dfe6051-37e3-43c5-a866-e9d3b38f57d3'; -- confirma order (já era 1)

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('e512557b-f4a5-4f83-9454-4c8e372c1167', 'Adicionais', false, 0, 4, 'per_option', 2)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Bacon extra', 5.00, 1),
  ('Cheddar extra', 4.00, 2),
  ('Carne extra', 8.00, 3)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('e512557b-f4a5-4f83-9454-4c8e372c1167', 'Molhos extras', false, 0, 2, 'per_option', 3)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Maionese temperada', 2.00, 1),
  ('Molho especial', 2.00, 2),
  ('Barbecue', 2.00, 3)
) as x(name, price, ord);


-- Combo Dudu Duplo (R$52,90) — "Escolha sua bebida" já existe (order 1, mantido, preço não alterado). Só adiciona:
with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('e815ed15-2271-42b8-a57c-eaa810c554ec', 'Adicionais', false, 0, 4, 'per_option', 2)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Bacon extra', 5.00, 1),
  ('Cheddar extra', 4.00, 2),
  ('Carne extra', 8.00, 3)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('e815ed15-2271-42b8-a57c-eaa810c554ec', 'Molhos extras', false, 0, 2, 'per_option', 3)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Maionese temperada', 2.00, 1),
  ('Molho especial', 2.00, 2),
  ('Barbecue', 2.00, 3)
) as x(name, price, ord);


-- Combo Casal Dudu (R$74,90) — "2 Dudu Clássicos + batata grande + 2 refrigerantes",
-- vira o combo configurável de 2 pessoas. Bebidas e hambúrgueres aqui são opções
-- internas do combo (texto livre) — não referenciam nem alteram produtos reais.
with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('e44012cb-e6e1-42da-8d00-803ca7a069e1', 'Escolha seu 1º hambúrguer', true, 1, 1, 'no_charge', 1)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Dudu Clássico', 0, 1),
  ('Dudu Bacon', 0, 2),
  ('Dudu Duplo', 0, 3),
  ('Dudu Monstro', 0, 4),
  ('Dudu Chicken', 0, 5)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('e44012cb-e6e1-42da-8d00-803ca7a069e1', 'Escolha seu 2º hambúrguer', true, 1, 1, 'no_charge', 2)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Dudu Clássico', 0, 1),
  ('Dudu Bacon', 0, 2),
  ('Dudu Duplo', 0, 3),
  ('Dudu Monstro', 0, 4),
  ('Dudu Chicken', 0, 5)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('e44012cb-e6e1-42da-8d00-803ca7a069e1', 'Escolha sua 1ª bebida', true, 1, 1, 'no_charge', 3)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Coca-Cola', 0, 1),
  ('Coca-Cola Zero', 0, 2),
  ('Guaraná', 0, 3),
  ('Sprite', 0, 4)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('e44012cb-e6e1-42da-8d00-803ca7a069e1', 'Escolha sua 2ª bebida', true, 1, 1, 'no_charge', 4)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Coca-Cola', 0, 1),
  ('Coca-Cola Zero', 0, 2),
  ('Guaraná', 0, 3),
  ('Sprite', 0, 4)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('e44012cb-e6e1-42da-8d00-803ca7a069e1', 'Adicionais', false, 0, 4, 'per_option', 5)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Bacon extra', 5.00, 1),
  ('Cheddar extra', 4.00, 2),
  ('Carne extra', 8.00, 3)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('e44012cb-e6e1-42da-8d00-803ca7a069e1', 'Molhos extras', false, 0, 2, 'per_option', 6)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Maionese temperada', 2.00, 1),
  ('Molho especial', 2.00, 2),
  ('Barbecue', 2.00, 3)
) as x(name, price, ord);


-- ============================================================
-- PORÇÕES
-- ============================================================

-- Batata Frita (R$14,90)
with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('2267aa19-3766-414d-bae6-cd1b67ffa416', 'Molhos', false, 0, 2, 'per_option', 1)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Maionese temperada', 2.00, 1),
  ('Molho especial', 2.00, 2),
  ('Barbecue', 2.00, 3)
) as x(name, price, ord);

-- Batata Cheddar & Bacon (R$22,90)
with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('64f056d3-a0dc-4722-813a-165c7d012a1b', 'Adicionais', false, 0, 2, 'per_option', 1)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Bacon extra', 5.00, 1),
  ('Cheddar extra', 4.00, 2)
) as x(name, price, ord);

with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('64f056d3-a0dc-4722-813a-165c7d012a1b', 'Molhos', false, 0, 2, 'per_option', 2)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Maionese temperada', 2.00, 1),
  ('Molho especial', 2.00, 2),
  ('Barbecue', 2.00, 3)
) as x(name, price, ord);

-- Onion Rings (R$18,90)
with g as (
  insert into product_option_groups (product_id, name, required, min_select, max_select, pricing_mode, "order")
  values ('9d1b0985-6a2b-40f3-b72f-4b95d602f0fe', 'Molhos', false, 0, 2, 'per_option', 1)
  returning id
)
insert into product_options (group_id, name, price, "order")
select id, x.name, x.price, x.ord from g, (values
  ('Maionese temperada', 2.00, 1),
  ('Molho especial', 2.00, 2),
  ('Barbecue', 2.00, 3)
) as x(name, price, ord);

commit;
