# VSFood Print

Aplicativo Windows (Tauri + React + TypeScript) que conecta um computador da loja ao VSFood e imprime
comandas automaticamente assim que um pedido chega — sem abrir o painel, sem clicar em nada.

Este projeto vive dentro do monorepo do VSFood, mas é **completamente isolado** do app Next.js: não
compartilha `node_modules`, não importa nada de `app/`/`components/`/`lib/` do Next, e tem seu próprio
`package.json`. A única ponte entre os dois é HTTP, via `/api/print/*` no VSFood web.

## Arquitetura

```
Windows (VSFood Print)                    VSFood web (Next.js)                 Supabase
┌─────────────────────┐                  ┌───────────────────────┐          ┌──────────────┐
│ React (src/)         │  invoke/emit    │                        │          │              │
│  Onboarding/Pairing/  │◄───────────────►│ /api/print/pair        │          │ print_devices │
│  Main/History         │  Tauri commands │ /api/print/heartbeat   │          │ print_pairing_│
├───────────────────────┤                 │ /api/print/next-job    │ service  │   codes       │
│ Rust (src-tauri/)      │  Bearer <token>│ /api/print/success     │ role     │ orders        │
│  api_client (reqwest)  │───────HTTPS───►│ /api/print/failure     │─────────►│ restaurants   │
│  secure_store (keyring)│                │ /api/print/device      │          │ (RLS nunca    │
│  printing (WinAPI)     │                │                        │          │  vista pelo   │
│  queue (loop de fundo) │                │ claim_next_print_order │          │  app)         │
│  tray/autostart        │                │ (RPC já existente)     │          │              │
└───────────────────────┘                 └───────────────────────┘          └──────────────┘
```

O app **nunca** fala com o Supabase diretamente e **nunca** vê a service role — só chama endpoints
HTTP do VSFood web autenticados pelo próprio token do dispositivo.

### Estrutura de pastas

```
vsfood-print/
├── src/                    # frontend React/TS
│   ├── screens/            # Onboarding, Pairing, Main, History
│   ├── lib/tauri.ts         # wrapper tipado sobre invoke()/listen()
│   ├── App.tsx              # máquina de estados das telas
│   └── styles.css           # tema VSFood (dark, laranja/vermelho)
├── src-tauri/
│   ├── src/
│   │   ├── main.rs / lib.rs        # bootstrap, plugins, tray, invoke_handler
│   │   ├── commands.rs              # comandos expostos ao frontend
│   │   ├── queue.rs                 # loop de fundo: heartbeat + claim + print + retry
│   │   ├── api_client.rs            # HTTP client pro VSFood web (reqwest)
│   │   ├── secure_store.rs          # token no Windows Credential Manager (keyring)
│   │   ├── settings.rs              # preferências locais não-secretas (JSON)
│   │   ├── state.rs                 # estado em memória (sessão, impressora, pausado)
│   │   ├── models.rs                # DTOs espelhando o payload do VSFood web
│   │   └── printing/
│   │       ├── ticket.rs            # monta as linhas da comanda (independente de formato)
│   │       ├── render_a4.rs         # desenha e imprime A4 via GDI (driver da impressora)
│   │       └── windows_spool.rs     # EnumPrinters + job RAW (reservado pro ESC/POS futuro)
│   ├── capabilities/default.json
│   └── tauri.conf.json
└── README.md
```

## Tecnologia e compatibilidade

- **Tauri 2** + **React 19** + **TypeScript** + **Vite 7** — mesmas versões major usadas no restante
  do ecossistema (React 19 já é o que o VSFood web usa em produção).
- Bundle final é um `.exe`/instalador nativo com WebView2 (já vem com o Windows 10/11) — não embute um
  Chromium inteiro como o Electron faria. Isso é o que o deixa leve.
- Testado em Windows 11 (ambiente de desenvolvimento). Requisitos de build abaixo.

## Requisitos pra rodar/gerar o build

1. **Node.js** 18+ (o repo já usa Node 24).
2. **Rust** (via [rustup](https://rustup.rs)) — `rustup-init.exe -y` instala sem precisar de admin.
3. **MSVC Build Tools** (Windows) — **isso precisa de administrador** e é o único pré-requisito que
   não foi possível instalar automaticamente neste ambiente de desenvolvimento (sandbox sem elevação).
   Rode numa janela do PowerShell **como Administrador**:
   ```powershell
   winget install --id Microsoft.VisualStudio.2022.BuildTools -e --override "--quiet --wait --add Microsoft.VisualStudio.Component.VC.Tools.x86.x64 --add Microsoft.VisualStudio.Component.Windows11SDK.22621"
   ```
   Depois disso, feche e abra um terminal novo (pra o PATH atualizar) antes de rodar `cargo build`/`npm run tauri build`.
   > Se você usa Git Bash: rode os comandos de build numa janela do **PowerShell ou cmd normal**, não
   > no Git Bash — o Git para Windows traz um `link.exe` próprio (um utilitário Unix `ln`, não o linker
   > da Microsoft) que pode ficar na frente do `link.exe` de verdade no PATH e confundir o `cargo build`.
4. **WebView2 Runtime** — já vem instalado por padrão no Windows 11 (confirmado neste ambiente).

## Como rodar em desenvolvimento

```bash
cd vsfood-print
npm install
npm run tauri dev
```

Isso abre o app com hot-reload do frontend. Por padrão ele fala com `https://vsfood.vercel.app`
(produção). Pra apontar pra outro ambiente (preview/local), defina antes de rodar:

```powershell
$env:VSFOOD_API_BASE_URL = "https://seu-preview.vercel.app"
npm run tauri dev
```

## Como gerar o instalador (.exe)

```bash
cd vsfood-print
npm run tauri build
```

`tauri.conf.json > bundle.targets` está fixado em `["nsis"]` (só o instalador NSIS, um único `.exe`)
— de propósito, pra nunca ter dúvida sobre "qual arquivo é o final" entre `.msi`/`.exe`/`.app` etc.

**Instalador gerado em:**
```
src-tauri/target/release/bundle/nsis/VSFood Print_<versão>_x64-setup.exe
```
(o número da versão vem de `tauri.conf.json` / `package.json`, hoje `0.1.0`).

## Fluxo de release (publicar uma versão pro botão de download funcionar)

**Não commitamos nenhum binário gerado no Git** (`src-tauri/target/` já está no `.gitignore`) — a
distribuição é via **GitHub Releases**, que é feito pra hospedar assets binários e dá uma URL estável
por asset. Passo a passo:

1. Gerar o instalador:
   ```bash
   cd vsfood-print
   npm run tauri build
   ```
2. Localizar o arquivo gerado em `src-tauri/target/release/bundle/nsis/*.exe` (caminho exato acima).
3. Criar uma **GitHub Release** no repositório (tag sugerida: `vsfood-print-v0.1.0`, pra não colidir
   com tags do VSFood web se houver):
   ```bash
   gh release create vsfood-print-v0.1.0 "src-tauri/target/release/bundle/nsis/VSFood Print_0.1.0_x64-setup.exe" \
     --title "VSFood Print v0.1.0" --notes "Primeira versão — impressão automática A4."
   ```
   (ou pela UI do GitHub: Releases > Draft a new release > anexar o `.exe` nos assets.)
4. Copiar a **URL do asset** anexado (aparece na página da release; formato
   `https://github.com/<org>/<repo>/releases/download/vsfood-print-v0.1.0/VSFood.Print_0.1.0_x64-setup.exe`).
5. Definir essa URL na variável de ambiente **`NEXT_PUBLIC_VSFOOD_PRINT_DOWNLOAD_URL`** do projeto
   VSFood web na Vercel (Project Settings > Environment Variables) — é a única variável que o botão de
   download lê (centralizada em `lib/vsfood-print.ts`; nenhum outro arquivo tem a URL hardcoded).
6. Redeployar o VSFood web (`vercel deploy --prod` ou um novo push, conforme seu fluxo) — assim que a
   env var estiver presente, o botão "Baixar VSFood Print" em `/painel/impressao` e `/vsfood-print`
   passa a apontar pro instalador de verdade; sem ela, continua mostrando "Disponível em breve".
7. Ao lançar uma nova versão, repetir os passos 1–6 e atualizar `VSFOOD_PRINT_VERSION` em
   `lib/vsfood-print.ts` (VSFood web) pra bater com a versão mostrada perto do botão.

Alternativas ao GitHub Releases (se preferir não usar): um bucket S3, Supabase Storage, ou qualquer
CDN — a única exigência é que `NEXT_PUBLIC_VSFOOD_PRINT_DOWNLOAD_URL` aponte pra uma URL pública e
estável do `.exe`.

## Variáveis de ambiente

| Variável | Onde | Obrigatória | Descrição |
|---|---|---|---|
| `VSFOOD_API_BASE_URL` | processo Rust (build/dev) | não (default `https://vsfood.vercel.app`) | Base URL do VSFood web que o app chama. |
| `NEXT_PUBLIC_VSFOOD_PRINT_DOWNLOAD_URL` | VSFood web (`.env`) | não | URL do instalador publicado; sem ela, o botão de download mostra "Disponível em breve". |

Nenhuma outra variável é necessária — o app nunca lida com chaves do Supabase.

## Segurança

- **Sem login do dono no app**: o pareamento troca um código curto (gerado em
  `/painel/impressao`, válido ~10 min, uso único) por um **token de dispositivo** de alta entropia.
- **Nunca texto puro no banco**: tanto o código de pareamento quanto o token de dispositivo são
  guardados como hash SHA-256 (`code_hash`/`token_hash`) — ver `lib/print-devices/token.ts` no VSFood web.
- **Token no cofre do Windows**: `secure_store.rs` usa a crate `keyring` (Windows Credential Manager),
  nunca um arquivo de texto.
- **Nunca embutimos a service role da Supabase** nem qualquer credencial do dono no executável — o app
  só conhece a URL do VSFood web e o próprio token.
- **`restaurant_id` nunca vem do app**: toda rota `/api/print/*` deriva o `restaurant_id` a partir do
  token (ver `lib/print-devices/auth.ts` no VSFood web) — o app não pode, mesmo tentando, acessar dados
  de outra loja.
- **Rate limit no pareamento**: `/api/print/pair` limita tentativas por IP (best-effort, em memória —
  ver limitação abaixo) — o código de 6 dígitos tem baixa entropia, então isso e a expiração curta
  juntos evitam força bruta.
- **Revogação imediata**: "Revogar acesso" no painel marca o dispositivo `active = false` — a próxima
  chamada de qualquer endpoint autenticado com aquele token falha na hora.

## Como a impressão silenciosa funciona

Duas abordagens diferentes, uma pra cada formato — ver comentários em `printing/mod.rs`:

- **A4 (V1, implementado)**: `printing::render_a4` usa GDI diretamente (`CreateDC` no nome da
  impressora + `StartDoc`/`StartPage`/`TextOut`/`LineTo`/`EndPage`/`EndDoc`). Isso desenha a comanda
  **através do driver de verdade da impressora instalada no Windows** — funciona com qualquer
  impressora A4 com driver instalado (laser, jato de tinta, HP, Epson, Canon...), porque quem rasteriza
  a página é o próprio driver. O diálogo "Imprimir" do Windows é uma peça de UI separada — como essas
  chamadas GDI falam direto com o driver, o diálogo nunca aparece.
- **58mm/80mm (arquitetura pronta, ESC/POS ainda não implementado)**: `printing::windows_spool::print_raw`
  já existe e faz o outro tipo de job (RAW, bypass total do driver, bytes crus direto pro spooler) —
  é exatamente o mecanismo que impressoras térmicas ESC/POS esperam. Quando o suporte a 58mm/80mm for
  implementado, só precisa de um `render_escpos.rs` novo que consome a mesma lista de `TicketLine` de
  `printing/ticket.rs` (a comanda já é montada de forma independente de formato) e chama `print_raw`.

Ambas as abordagens usam a crate `windows` (bindings oficiais da Microsoft pra Win32 em Rust, mantida
pela própria Microsoft) — nada de hack, nada de abrir/fechar um app externo escondido.

## Fila, claim e duplicidade

- `claim_next_print_order` (RPC já existente no Supabase) usa `for update skip locked`: dois
  dispositivos (ou dois ciclos de polling) nunca conseguem reivindicar o mesmo pedido.
- O app só chama `/api/print/next-job` (que por sua vez chama esse RPC) quando a impressora selecionada
  está de fato presente no Windows — se ela sumiu, o app nem reivindica o próximo pedido, então ele
  continua disponível (`pending`) em vez de ficar preso em `processing` sem imprimir.
- **Retry automático local**: se a impressão falhar, o app tenta de novo até 3 vezes (com 2s de
  intervalo) **sem** pedir um novo job ao servidor — só depois de esgotar as tentativas é que reporta
  falha (`/api/print/failure`), o pedido fica `failed` e aparece no histórico com o erro.
- **Retry manual**: pelo painel, "Reimprimir pedido" volta o `print_status` pra `pending` — o app pega
  esse pedido de novo no próximo ciclo de polling (a cada ~5s), sem precisar de nenhum botão específico
  no app pra isso.
- **Recuperação de job preso**: se o app fechar/crashar entre o claim e a confirmação, o pedido fica
  `processing` indefinidamente sem essa recuperação. `recover_stale_print_orders(p_stale_minutes)`
  (nova migration) volta qualquer pedido `processing` há mais de 5 minutos pra `pending` — chamado a
  cada vez que o app pede o próximo job. Reimprimir uma via a mais é bem menos ruim que nunca imprimir.

## Segundo plano, bandeja e início automático

- Fechar a janela no X **minimiza pra bandeja** em vez de encerrar o processo (o polling continua
  rodando) — ícone na bandeja com menu: Abrir VSFood Print / Pausar impressão / Sair.
- "Iniciar com o Windows" usa `tauri-plugin-autostart` (plugin oficial do Tauri), sem hack de registro
  manual.

## Limitações atuais (V1)

- **Só A4** tem impressão de verdade; 58mm/80mm ainda não geram ESC/POS (arquitetura já preparada, ver
  seção acima).
- **Sem assinatura de código**: o `.exe` gerado não é assinado — o Windows SmartScreen provavelmente vai
  avisar "Windows protegeu seu PC" na primeira execução em qualquer computador que não seja o de
  desenvolvimento. Não tente contornar isso; um certificado de code signing é a solução correta, a
  avaliar depois.
- **Rate limit do pareamento é em memória do processo Node** (não é um contador persistido) — reseta a
  cada cold start da função serverless e não é compartilhado entre regiões/instâncias da Vercel. É
  suficiente pra V1 (código expira em minutos e é de uso único), mas não é um rate limit "de verdade"
  distribuído — se isso importar depois, trocar por um contador no Postgres ou Upstash/Vercel KV.
- **Sem atualização automática ainda**: arquitetura pronta pra usar o updater oficial do Tauri
  (`tauri-plugin-updater`) depois — falta só publicar um endpoint/feed de releases assinado.
- **Paginação simples**: se a comanda A4 for maior que uma página, o conteúdo é cortado em vez de
  continuar numa segunda página (aceitável pra V1, ver `render_a4.rs`).
- **Não verificado nesta máquina**: o Rust deste projeto foi validado com `cargo check` usando um
  toolchain GNU/MinGW portátil (sem precisar de administrador), mas o **build final do instalador
  (`npm run tauri build`, que precisa do MSVC)** ainda não foi gerado neste ambiente — falta o passo de
  administrador descrito em "Requisitos" acima.

## Testes que faltam (precisam de hardware/interação real)

Ver checklist completo na mensagem de entrega, mas resumindo o que só dá pra confirmar na sua máquina:
impressão de teste numa impressora A4 real, pedido real de ponta a ponta, impressora ficando offline,
internet caindo, fechar/abrir o app, dois pedidos em sequência, revogar dispositivo, reiniciar o Windows.
