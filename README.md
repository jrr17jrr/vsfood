# VSFood

SaaS multi-restaurante: cardápio digital, pedidos online e pagamento (PIX/cartão via Mercado Pago) para restaurantes, lanchonetes, pizzarias e negócios de delivery. Cada restaurante tem sua própria loja pública (`/loja/[slug]`), painel administrativo (`/painel`) e o VSFood tem um painel DEV (`/admin`) para operar a plataforma inteira.

## Stack

- **Next.js 16 (App Router) + TypeScript**, Tailwind CSS v4, shadcn/ui.
- **Supabase**: Postgres, Auth, Storage, Realtime. Schema versionado em `supabase/migrations`.
- **Mercado Pago**: SDK oficial (`mercadopago`) no servidor para OAuth + Payments API; tokenização de cartão no client via Secure Fields.
- Zustand (carrinho/checkout), react-hook-form + zod (formulários e validação), qrcode (QR Code da loja).

## Setup local

1. **Instalar dependências**: `npm install`.
2. **Criar um projeto no [Supabase](https://supabase.com)** e aplicar as migrations:
   - Via SQL Editor do dashboard: cole e rode, em ordem, cada arquivo de `supabase/migrations/*.sql`.
   - Ou via [Supabase CLI](https://supabase.com/docs/guides/cli): `supabase link` e `supabase db push`.
3. **Copiar variáveis de ambiente**: `cp .env.example .env.local` e preencher:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — em Project Settings > API do Supabase.
   - `TOKEN_ENCRYPTION_KEY` — gere com `openssl rand -base64 32`. Usada para criptografar os tokens do Mercado Pago no banco.
   - `MERCADOPAGO_CLIENT_ID` / `MERCADOPAGO_CLIENT_SECRET` / `MERCADOPAGO_REDIRECT_URI` — crie uma aplicação em https://www.mercadopago.com.br/developers/panel/app (use as credenciais de **teste/sandbox** durante o desenvolvimento).
   - `MERCADOPAGO_WEBHOOK_SECRET` — chave secreta do webhook (painel MP > Webhooks).
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` — conta DEV inicial (usada pelo seed).
4. **Rodar o seed** (cria o admin e a loja de demonstração "Dudu Burger" com cardápio completo): `npm run seed`.
5. **Subir o app**: `npm run dev` e acessar http://localhost:3000.
6. **(Opcional) Login com Google**: o código já está pronto, falta só a configuração externa — siga [`GOOGLE_AUTH_SETUP.md`](./GOOGLE_AUTH_SETUP.md).

## Estrutura

```
app/            rotas (App Router) — públicas, conta do cliente, /painel, /admin, webhooks
components/     componentes shadcn/ui + componentes de feature
lib/            supabase clients, auth helpers, validações zod, integração Mercado Pago, cálculo de pedido
supabase/       migrations SQL (schema + RLS + storage)
scripts/seed.ts seed do admin + restaurante demo
types/          tipos do banco (Database) compartilhados com o client Supabase
```

## Segurança / multi-tenancy

- Toda tabela sensível tem RLS habilitada; isolamento entre restaurantes é garantido por `restaurant_id` + funções `is_admin()` / `is_restaurant_member()` (ver `supabase/migrations/*_rls.sql`).
- Pedidos nunca são inseridos diretamente pelo client: uma Server Action com a **service role** recalcula preços, adicionais, cupom e taxa de entrega a partir do banco antes de gravar o pedido — o total enviado pelo frontend nunca é confiado.
- Tokens do Mercado Pago ficam apenas no backend, criptografados em `mercadopago_connections` (sem policy de leitura para o client).

Desenvolvido por [Visionário Dev](https://visionariodev.com.br).
