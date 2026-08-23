VSFood - ajustes prontos

O pacote contém somente arquivos novos/alterados para substituir no projeto.

CORREÇÕES:
1) Fotos dos produtos:
   - next.config.ts agora aceita images.unsplash.com.
   - Rode sql/dudu-product-images.sql no Supabase para garantir URLs válidas na Dudu Burger.
   - Depois faça novo deploy da Vercel, porque mudança no next.config.ts exige rebuild.

2) Modal no tema claro:
   - As CSS variables da loja agora são passadas também para o Dialog portal.
   - Antes o modal era renderizado fora do wrapper da loja, então perdia --store-* e herdava cores globais.
   - Textos, adicionais, preços, textarea, footer e controles agora usam explicitamente as variáveis da loja.
   - Overflow horizontal removido.

3) Menu de categorias:
   - Removi o sticky porque ele continuava sobrepondo os produtos no layout real.
   - O menu agora fica no fluxo normal da página e não cobre cards.
   - Cliques continuam com scroll suave e categoria ativa.

ARQUIVOS:
- next.config.ts
- app/loja/[slug]/page.tsx
- components/store/category-nav.tsx
- components/store/product-catalog.tsx
- components/store/product-modal.tsx
- sql/dudu-product-images.sql

PASSOS:
1. Faça backup do projeto.
2. Substitua os arquivos mantendo as mesmas pastas.
3. Rode sql/dudu-product-images.sql no Supabase SQL Editor.
4. Commit/push.
5. Redeploy na Vercel.
6. Teste Dudu Burger no claro/escuro, desktop e mobile.

=== AJUSTE V2 - CORES NAO SALVAVAM ===

Foram adicionados 2 arquivos novos ao pacote:

- components/painel/color-field.tsx
  Corrige o problema de registrar DOIS inputs diferentes com o mesmo nome no react-hook-form. Agora apenas o campo HEX fica registrado e o color picker sincroniza com ele, evitando valor perdido/inconsistente no submit.

- lib/actions/painel/settings.ts
  Agora confirma que a linha do restaurante foi realmente atualizada, mostra o erro real do Supabase se falhar e revalida /painel/aparencia + /loja/[slug] logo apos salvar.

IMPORTANTE:
A coluna restaurants.theme precisa existir no Supabase. Se ainda nao rodou a migration 20260824000001_restaurant_theme.sql, rode antes.

Depois de substituir estes arquivos, faça novo deploy da Vercel.

=== AJUSTE V3 - MENU DE CATEGORIAS FIXO ===

- components/store/category-nav.tsx
  O menu voltou a ser sticky com top-0, z-50 e fundo totalmente opaco.
  Nao usa position: fixed e continua no fluxo da pagina.
  O clique nas categorias agora calcula a altura real do menu antes de rolar,
  evitando que o titulo fique escondido.
  A categoria ativa tambem e centralizada automaticamente no scroll horizontal
  em telas pequenas.

- components/store/product-catalog.tsx
  scroll-mt ajustado para scroll-mt-20 como protecao adicional para navegacao
  por ancora/scroll.

Nenhum SQL novo e necessario para o V3.
