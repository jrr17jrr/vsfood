-- VSFood — modos de cobrança para grupos de opcionais/adicionais
--
-- Evolui product_option_groups (já existente) em vez de criar um sistema
-- novo: adiciona a regra de cobrança do grupo sem quebrar dados atuais.
-- Grupos já cadastrados assumem 'per_option' (soma o preço de cada opção
-- selecionada) — exatamente o comportamento que já tinham antes desta
-- migration, então nada muda visualmente para lojas existentes.

do $$ begin
  create type option_group_pricing_mode as enum (
    'no_charge',    -- nenhuma seleção do grupo altera o preço
    'per_option',   -- soma o preço individual de cada opção selecionada
    'free_first_n', -- as primeiras N opções escolhidas são grátis; da (N+1)-ésima em diante cobra o valor individual
    'highest_only', -- cobra apenas a opção selecionada mais cara
    'fixed_price'   -- qualquer seleção válida no grupo adiciona um valor fixo, uma única vez
  );
exception when duplicate_object then null; end $$;

alter table product_option_groups
  add column if not exists pricing_mode option_group_pricing_mode not null default 'per_option',
  add column if not exists free_quantity int not null default 0,
  add column if not exists fixed_price numeric(10,2) not null default 0;

do $$ begin
  alter table product_option_groups
    add constraint product_option_groups_min_max_check check (min_select <= max_select);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table product_option_groups
    add constraint product_option_groups_max_check check (max_select >= 1);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table product_option_groups
    add constraint product_option_groups_required_min_check check (not required or min_select >= 1);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table product_option_groups
    add constraint product_option_groups_free_quantity_check check (free_quantity >= 0 and free_quantity <= max_select);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table product_option_groups
    add constraint product_option_groups_fixed_price_check check (fixed_price >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table product_options
    add constraint product_options_price_check check (price >= 0);
exception when duplicate_object then null; end $$;
