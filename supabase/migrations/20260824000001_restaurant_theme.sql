-- VSFood — tema/cores personalizáveis da loja pública
--
-- `primary_color` já existia mas nunca foi de fato aplicado em /loja/[slug] —
-- esta migration não mexe nele (mantido por compatibilidade, sincronizado
-- pela action a partir de agora) e adiciona `theme` jsonb com as demais cores
-- pedidas. Backfill abaixo garante que toda loja existente ganha um tema
-- completo e coerente com a aparência atual do VSFood — nada muda visualmente
-- até o dono editar em /painel/aparencia.
alter table restaurants add column if not exists theme jsonb;

update restaurants
set theme = jsonb_build_object(
  'primary', coalesce(primary_color, '#F0631D'),
  'secondary', '#F0B429',
  'background', '#FFFFFF',
  'card', '#FFFFFF',
  'header', '#FFFFFF',
  'categoryBg', '#F5F5F5',
  'text', '#1A1A1A',
  'textMuted', '#6B7280',
  'button', coalesce(primary_color, '#F0631D'),
  'buttonText', '#FFFFFF',
  'price', coalesce(primary_color, '#F0631D'),
  'categoryActive', coalesce(primary_color, '#F0631D'),
  'border', '#E5E7EB'
)
where theme is null;
