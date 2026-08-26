-- VSFood — atualização comercial dos planos: Básico R$69/mês (R$690/ano) e
-- Pro R$119/mês (R$1.190/ano), ambos com 7 dias grátis. Pro deixa de ser
-- "em breve" — passa a existir de verdade.
--
-- Pagamento online (PIX/cartão via Mercado Pago) passa a ser exclusivo do
-- Pro: o link da feature 'online_payment' estava no Básico (seed original em
-- 20260823000002_plans.sql), mas nenhuma tela hoje usa esse link pra bloquear
-- nada em tempo de execução — lib/plans/features.ts passa a checar isso de
-- verdade em lib/actions/checkout.ts e lib/actions/orders.ts.

update plans set price_monthly = 69.00, price_yearly = 690.00
where code = 'basic';

update plans set price_monthly = 119.00, price_yearly = 1190.00, cta_label = 'Testar 7 dias grátis'
where code = 'pro';

delete from plan_feature_links
where plan_id = (select id from plans where code = 'basic')
  and feature_id = (select id from plan_features where key = 'online_payment');

-- Pro = tudo que o Básico tem...
insert into plan_feature_links (plan_id, feature_id)
select (select id from plans where code = 'pro'), l.feature_id
from plan_feature_links l
where l.plan_id = (select id from plans where code = 'basic')
on conflict do nothing;

-- ...+ pagamento online, exclusivo dele.
insert into plan_feature_links (plan_id, feature_id)
select (select id from plans where code = 'pro'), (select id from plan_features where key = 'online_payment')
on conflict do nothing;
