# TerreiroMap

Plataforma para mapear e encontrar terreiros de Umbanda, Candomblé e tradições afro-brasileiras.

## Telas implementadas

### Autenticação
- Splash / Logo
- Primeiro Acesso (Usuário ou Terreiro)
- Login
- Cadastro de Usuário
- Cadastro de Terreiro

### Perfil Usuário
- Home com mapa interativo
- Lista de Terreiros (busca + filtros)
- Detalhe do Terreiro
- Eventos
- Favoritos
- Sugestão de cadastro
- Atualizar perfil

### Perfil Terreiro
- Home com mapa + campanha de doações
- Gerenciar eventos
- Campanhas de doação
- Favoritos
- Atualizar perfil

## Como rodar

```bash
npm install
cp .env.example .env   # preencha com as URLs do Supabase
npm run db:setup         # cria tabelas + seed (primeira vez)
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

Contas de teste (após o seed):

| Email | Senha | Perfil |
|---|---|---|
| `usuario@teste.com` | `123456` | Usuário |
| `terreiro@teste.com` | `123456` | Terreiro |

## Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. **Project Settings → Database → Connection string**
3. Copie a **Direct connection** (porta 5432) → `DIRECT_URL` no `.env`
4. Copie a **Transaction pooler** (porta 6543) → `DATABASE_URL` no `.env`  
   Adicione `?pgbouncer=true` no final da URL
5. Rode:

```bash
npm run db:check   # testa conexão
npm run db:setup   # schema + dados iniciais
```

## Deploy na Vercel

### 1. Variáveis de ambiente

No painel Vercel → **Project → Settings → Environment Variables**, importe o `.env` local ou adicione manualmente.

**Importante (Vercel + Supabase):** a Vercel só usa **IPv4**. A URL direta `db.[ref].supabase.co:5432` é **IPv6** e falha em produção (`Can't reach database server`).

Use o **Session pooler IPv4** do Supabase (porta 5432, host `*.pooler.supabase.com`):

```env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[SENHA]@aws-1-us-west-2.pooler.supabase.com:5432/postgres?connection_limit=1
DIRECT_URL=postgresql://postgres:[SENHA]@db.[PROJECT-REF].supabase.co:5432/postgres
```

Depois de alterar variáveis: `npx vercel --prod`

Script auxiliar (após ajustar `.env` local):

```bash
npx tsx scripts/push-vercel-env.ts
npx vercel --prod
```

### 2. Supabase Auth (URLs de produção)

Depois do primeiro deploy, copie a URL da Vercel (ex.: `https://terreiro-map.vercel.app`).

No Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://seu-projeto.vercel.app`
- **Redirect URLs:** `https://seu-projeto.vercel.app/**`

### 3. Publicar

**Opção A — CLI (sem GitHub):**

```bash
npx vercel login
npx vercel          # preview
npx vercel --prod   # produção
```

**Opção B — GitHub:**

1. Envie o repositório para o GitHub
2. [vercel.com/new](https://vercel.com/new) → Import Project
3. Framework detectado: Next.js (build: `npm run build`)
4. Configure as variáveis e faça Deploy

O `postinstall` roda `prisma generate` automaticamente no build.

## Autenticação (Supabase Auth)

1. No Supabase → **Authentication → Sign In / Providers → Email**, desative **Confirm email** (facilita testes locais).
2. Em **Project Settings → API**, copie a chave **service_role** para o `.env`:

```env
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
```

3. Sincronize as contas de teste:

```bash
npm run db:seed-auth
```

4. Entre com:
   - `usuario@teste.com` / `123456`
   - `terreiro@teste.com` / `123456`

Novos cadastros em `/cadastro/usuario` ou `/cadastro/terreiro` criam conta no Supabase Auth + perfil no Prisma.

## Stack

- Next.js 16 (App Router)
- React + TypeScript
- Tailwind CSS
- Leaflet (mapa OpenStreetMap)
- PostgreSQL + Prisma (Supabase)

## Créditos

Desenvolvido por [Ratyel Alves · C0tr4x](https://github.com/RatyelAlves).
