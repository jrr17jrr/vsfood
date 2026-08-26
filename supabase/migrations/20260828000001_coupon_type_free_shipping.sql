-- VSFood — novo tipo de cupom: frete grátis.
-- Isolado em migration própria porque `alter type ... add value` não pode ser
-- referenciado na mesma transação em que é criado (limitação do Postgres) —
-- migrations seguintes já podem usar 'free_shipping' normalmente.

alter type coupon_type add value if not exists 'free_shipping';
