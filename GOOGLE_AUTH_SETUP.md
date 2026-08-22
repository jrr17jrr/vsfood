# Login com Google — configuração

O código já está pronto (botão "Continuar com Google" no login e no cadastro de
cliente, callback, criação automática de perfil, gate de WhatsApp). Falta só a
configuração externa, que só você pode fazer (precisa das suas contas
Supabase e Google). Este documento é o passo a passo.

Nenhuma credencial foi inventada em lugar nenhum do código — tudo isso vive no
painel do Supabase e no Google Cloud Console, nunca em variáveis de ambiente
deste projeto (veja a seção "Por que não há variáveis do Google no `.env`" no
final).

---

## A. Supabase

### 1. Criar o projeto
Se ainda não tem um projeto, crie em [supabase.com](https://supabase.com) → **New project**.
Depois aplique as migrations de `supabase/migrations/` (SQL Editor ou `supabase db push`) — veja o `README.md` principal.

### 2. Pegar a Project URL e a anon key
**Project Settings → API**:
- **Project URL** → cole em `NEXT_PUBLIC_SUPABASE_URL` no seu `.env.local`
- **anon / public key** → cole em `NEXT_PUBLIC_SUPABASE_ANON_KEY`

(A `service_role` key vai em `SUPABASE_SERVICE_ROLE_KEY` — nunca no frontend, isso já está correto no código.)

### 3. Ativar o provider do Google
**Authentication → Sign In / Providers → Google** → habilite o toggle.
Você vai ver dois campos vazios: **Client ID** e **Client Secret** — deixe essa aba aberta, você volta aqui depois de gerar as duas coisas no Google Cloud (passo B.4).

Nessa mesma tela o Supabase mostra um **Callback URL (for OAuth)** parecido com:

```
https://SEU-PROJETO-REF.supabase.co/auth/v1/callback
```

**Copie essa URL exata** — é ela que você vai colar no Google Cloud Console (não é uma URL do VSFood, é do próprio Supabase).

### 4. Configurar Redirect URLs
**Authentication → URL Configuration**:
- **Site URL**: a URL principal do seu app (em produção, ex. `https://vsfood.com.br` — ajuste para o seu domínio real)
- **Redirect URLs**: adicione as URLs de callback do **VSFood** (não confundir com a URL do passo 3, que é do Supabase). O código sempre redireciona para `/auth/callback` dentro do próprio app, então adicione:
  - `http://localhost:3000/auth/callback` (desenvolvimento local)
  - `https://vsfood.com.br/auth/callback` (produção — troque pelo seu domínio real)

Se essa URL não estiver na lista, o Supabase recusa o login com um erro de "redirect not allowed".

### 5. Onde colocar o Client ID e o Client Secret do Google
De volta em **Authentication → Providers → Google** (passo 3): cole o **Client ID** e o **Client Secret** gerados no Google Cloud (passo B.7) e salve.

---

## B. Google Cloud

### 1. Criar um projeto
Em [console.cloud.google.com](https://console.cloud.google.com) → selecione ou crie um projeto (ex. "VSFood").

### 2. Configurar a tela de consentimento OAuth
**APIs & Services → OAuth consent screen**:
- Tipo: **External** (a menos que você use Google Workspace só internamente)
- Preencha nome do app ("VSFood"), e-mail de suporte, logo (opcional)
- Escopos: os padrão (`email`, `profile`, `openid`) já bastam — não precisa adicionar nada
- Em modo **Testing**, adicione seu próprio e-mail Google como *test user* para conseguir testar antes de publicar o app

### 3. Criar as credenciais OAuth
**APIs & Services → Credentials → Create Credentials → OAuth client ID**.

### 4. Tipo da aplicação
**Web application**.

### 5. Authorized JavaScript origins
As origens de onde o login é iniciado (o domínio do **VSFood**, sem caminho):
- `http://localhost:3000`
- `https://vsfood.com.br` (ajuste para o seu domínio real de produção)

### 6. Authorized redirect URIs
Aqui vai a URL que você copiou no passo A.3 — **a do Supabase**, não a do VSFood:
```
https://SEU-PROJETO-REF.supabase.co/auth/v1/callback
```
Só essa. O Google nunca redireciona direto para o VSFood — ele redireciona para o Supabase, que processa o OAuth e só então manda o navegador de volta para `/auth/callback` do VSFood (isso é feito pelo `redirectTo` que o código já envia).

### 7. Onde pegar o Client ID e o Client Secret
Depois de criar, o Google mostra os dois na tela (e também ficam sempre visíveis em **Credentials**, clicando no client criado):
- **Client ID** → cole no Supabase (passo A.5)
- **Client Secret** → cole no Supabase (passo A.5) — nunca no código do VSFood

---

## C. Desenvolvimento local

- App roda em `http://localhost:3000` (`npm run dev`)
- `NEXT_PUBLIC_APP_URL=http://localhost:3000` no seu `.env.local`
- Google Cloud → Authorized JavaScript origins → `http://localhost:3000`
- Supabase → Redirect URLs → `http://localhost:3000/auth/callback`

Com isso, clicar em "Continuar com Google" localmente já funciona.

## D. Produção

Quando for para o ar:
- `NEXT_PUBLIC_APP_URL=https://vsfood.com.br` (troque pelo domínio real) nas variáveis de ambiente do seu host (Vercel etc.)
- Google Cloud → Authorized JavaScript origins → adicione `https://vsfood.com.br`
- Supabase → Redirect URLs → adicione `https://vsfood.com.br/auth/callback`
- Supabase → Site URL → `https://vsfood.com.br`

Você pode manter as entradas de localhost e de produção cadastradas ao mesmo tempo nos dois painéis — não precisa remover uma para adicionar a outra.

---

## Como testar depois de configurar

1. Preencha `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`).
2. `npm run dev` e acesse `http://localhost:3000/login`.
3. Clique em **Continuar com Google**, escolha sua conta de teste.
4. Você deve voltar autenticado em `/minha-conta` (ou na página de onde veio, se tiver clicado em "Entrar" a partir do checkout de uma loja).
5. Confira no Supabase (**Table Editor → profiles**) que uma linha foi criada com `provider = google`, `email`, `name` e `avatar_url` preenchidos, e `whatsapp` vazio.
6. Vá para `/checkout` de qualquer loja: como o WhatsApp está vazio, deve aparecer o modal "Antes de continuar, informe seu WhatsApp" antes de liberar o resto do checkout.

## O que já está implementado no código (não precisa mexer)

- Botão "Continuar com Google" em `/login` e em `/cadastro` (cadastro de cliente; **não** aparece no cadastro de restaurante, que continua e-mail/senha).
- `lib/actions/auth.ts` e `app/auth/callback/route.ts`: troca do `code` OAuth por sessão (`exchangeCodeForSession`), com validação de redirecionamento seguro (`redirect`/`next` só aceita caminhos internos, nunca URLs externas).
- Criação automática do perfil (`profiles`) no primeiro login — feita por um trigger no banco (`handle_new_auth_user`, em `supabase/migrations/20260822000003_functions_triggers.sql`), preenchendo `name`, `email`, `avatar_url` e `provider` a partir dos dados que o Google devolve. Não existe nenhuma chamada extra do frontend criando esse registro.
- **Vínculo de conta existente**: se um cliente já tem cadastro tradicional com `cliente@gmail.com` e depois usa "Continuar com Google" com o mesmo e-mail, o Supabase vincula automaticamente à mesma conta (comportamento padrão do GoTrue para e-mails verificados — não precisou de código extra). Se o e-mail da conta tradicional nunca foi confirmado, o Supabase pode recusar o vínculo; nesse caso o VSFood mostra "Este e-mail já está cadastrado com senha. Entre com e-mail e senha, ou confirme seu cadastro antes de usar o Google." em vez de um erro técnico.
- Gate de WhatsApp no checkout (`components/checkout/whatsapp-gate.tsx`): bloqueia o checkout até o cliente informar o WhatsApp, só quando ele ainda não tem um cadastrado — não afeta clientes que já vieram do cadastro tradicional (que já pedem WhatsApp).
- Redirecionamento de volta (`redirect`/`next`) preservado do login tradicional e do Google — clicar em "Entrar" a partir do checkout de uma loja volta para aquele checkout depois de autenticar.
- Logout (`signOutAction`) funciona igual para contas Google e tradicionais — é a mesma sessão do Supabase Auth nos dois casos.
- Login e recuperação de senha tradicionais continuam exatamente como antes.

## Por que não há variáveis do Google no `.env`

O fluxo OAuth do Supabase é *server-to-server*: o VSFood só chama
`supabase.auth.signInWithOAuth({ provider: 'google' })`, e é o **Supabase**
quem troca o código com o Google usando o Client ID/Secret que você cadastrou
no dashboard dele. O Client Secret do Google nunca precisa — e nunca deve —
existir no código ou nas variáveis de ambiente do VSFood.
