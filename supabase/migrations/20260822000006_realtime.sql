-- VSFood — habilita Realtime nas tabelas usadas para atualização ao vivo:
-- novo pedido / mudança de status no painel do restaurante e no acompanhamento do cliente.
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table payments;
