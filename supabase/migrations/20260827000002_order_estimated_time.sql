-- VSFood — snapshot do tempo estimado (entrega ou retirada, o que se aplicar)
-- no momento da criação do pedido. Puramente informativo/auditoria: se a
-- regra do restaurante/região mudar depois, o pedido já criado mantém o
-- valor que foi mostrado ao cliente no checkout — mesmo princípio de
-- price_snapshot/name_snapshot em order_items.

alter table orders
  add column if not exists estimated_time_minutes int;

alter table orders drop constraint if exists orders_estimated_time_minutes_non_negative;
alter table orders
  add constraint orders_estimated_time_minutes_non_negative check (estimated_time_minutes is null or estimated_time_minutes >= 0);
