# EstheticFlow Web

CRM WhatsApp em tempo real para clínicas de estética — versão **navegador** (sem Electron).

> Projeto independente. O app desktop está em [`../EstheticFlow-Desktop`](../EstheticFlow-Desktop).

## Estrutura

```
EstheticFlow-Web/
  backend/     API Fastify + Prisma
  frontend/    React + Vite
  docker/      PostgreSQL + Evolution API
```

## Funcionalidades

- **Dashboard** — métricas, próximos agendamentos e procedimentos populares
- **Chat WhatsApp** — receber e enviar mensagens em tempo real (Socket.IO)
- **Conectar WhatsApp pelo painel** — QR Code dentro do app, sem abrir o manager da Evolution
- **Agendamentos** — calendário semanal, CRUD e sync com Google Calendar
- **Procedimentos** — catálogo de serviços usado pela IA no atendimento
- **Respostas rápidas** — templates no chat (botão ⚡ ou comando `/`)
- **IA (Gemini)** — sugestão de resposta e agendamento via tools (`create_appointment`, `list_procedures`, etc.)

## Stack

| Camada    | Tecnologia                                      |
|-----------|-------------------------------------------------|
| Frontend  | React, Vite, Tailwind, Socket.IO Client, Axios  |
| Backend   | Node.js, TypeScript, Fastify, Prisma, Socket.IO |
| Banco     | PostgreSQL                                      |
| WhatsApp  | Evolution API v2.2.3 (Docker)                   |
| IA        | Google Gemini                                   |
| Calendário| Google Calendar (OAuth)                         |

## Pré-requisitos

Instale na sua máquina:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) **20+** (com npm)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Clonar o repositório

```bash
git clone https://github.com/SEU_USUARIO/EstheticFlow.git
cd EstheticFlow
```

## Configuração rápida (primeira vez)

### 1. Subir banco de dados, Redis e Evolution API

```bash
cd docker
docker compose up -d
cd ..
```

Aguarde os containers subirem. Portas usadas:

| Serviço              | Porta |
|----------------------|-------|
| Evolution API        | 8080  |
| PostgreSQL (Evolution)| 5432 |
| PostgreSQL (EstheticFlow) | 5433 |
| Redis                | 6379  |

### 2. Configurar o backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma db push
npx prisma generate
```

Os valores padrão do `.env.example` já funcionam para desenvolvimento local. Ajuste apenas o necessário:

```env
# Evolution API (Docker local) — admin é a chave padrão do docker-compose
EVOLUTION_API_KEY=admin
# EVOLUTION_INSTANCE_KEY é opcional — preencha apenas se usar uma chave por instância
EVOLUTION_INSTANCE_KEY=

# Opcional — IA no chat
GEMINI_API_KEY=sua-chave-gemini
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_AUTO_REPLY=false

# Opcional — Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

> **Nunca commite** o arquivo `.env` no GitHub.

### 3. Configurar o frontend

```bash
cd ../frontend
npm install
```

### 4. Conectar o WhatsApp (pelo próprio painel)

A conexão é feita **dentro do app**, sem precisar abrir o manager da Evolution.

1. Suba o Docker, o backend e o frontend (próxima seção)
2. Faça login como **admin** em [http://localhost:5173](http://localhost:5173)
3. Se o WhatsApp não estiver conectado, você é redirecionado automaticamente para a tela **Conectar WhatsApp** (`/whatsapp/setup`)
4. Também é possível acessar a qualquer momento pelo item **WhatsApp** na sidebar (visível só para admin)
5. No celular da clínica: **WhatsApp → Menu → Aparelhos conectados → Conectar aparelho** e escaneie o QR
6. O backend cria a instância `estheticflow` e configura o webhook automaticamente

> Acessar `http://localhost:8080/manager` é opcional — só use se quiser inspecionar a Evolution diretamente.

## Rodar o projeto (desenvolvimento)

Abra **3 terminais**:

**Terminal 1 — Backend**

```bash
cd backend
npx tsx src/server.ts
```

API em [http://localhost:3333](http://localhost:3333)

**Terminal 2 — Frontend**

```bash
cd frontend
npm run dev
```

Painel em [http://localhost:5173](http://localhost:5173)

**Terminal 3 — Docker** (se ainda não estiver rodando)

```bash
cd docker
docker compose up -d
```

### Login

O sistema usa **autenticação real** com e-mail, senha e JWT.

- **Primeiro acesso:** crie uma conta em `/register` (o primeiro usuário vira `admin`) ou use o admin criado automaticamente pelo `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- **Login:** acesse `/login` com e-mail e senha
- O token fica salvo no navegador e é enviado em todas as requisições à API

### Conectar / reconectar o WhatsApp

- Admins desconectados são redirecionados automaticamente para `/whatsapp/setup` ao logar
- O QR Code é gerado e atualizado a cada 4 segundos
- Para reconectar a qualquer momento, clique em **WhatsApp** na sidebar (ponto laranja indica desconectado)

## Estrutura do projeto

```
EstheticFlow/
├── backend/
│   ├── prisma/schema.prisma    # Modelos do banco
│   ├── src/
│   │   ├── routes/             # Rotas HTTP
│   │   ├── services/           # Regras de negócio
│   │   ├── sockets/            # Socket.IO
│   │   └── server.ts           # Entrada da API
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/              # Telas (Dashboard, Chat, etc.)
│   │   ├── components/         # Componentes React
│   │   └── api/                # Cliente HTTP
│   └── vite.config.js
├── docker/
│   └── docker-compose.yml      # Postgres + Redis + Evolution
└── README.md
```

## Editar o código

1. Clone o repo e siga a configuração acima
2. Faça alterações em `frontend/src` ou `backend/src`
3. O frontend recarrega automaticamente (`npm run dev`)
4. Reinicie o backend após mudanças no servidor (`Ctrl+C` → `npx tsx src/server.ts`)
5. Após alterar `schema.prisma`:

   ```bash
   cd backend
   npx prisma db push
   npx prisma generate
   ```

## Variáveis de ambiente

Veja o arquivo [`backend/.env.example`](backend/.env.example) para a lista completa.

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Conexão PostgreSQL (porta **5433**) |
| `EVOLUTION_API_URL` | URL da Evolution API (`http://localhost:8080`) |
| `EVOLUTION_INSTANCE` | Nome da instância WhatsApp (padrão: `estheticflow`) |
| `EVOLUTION_API_KEY` | Chave global da Evolution (padrão `admin` no docker-compose) |
| `EVOLUTION_INSTANCE_KEY` | Chave por instância (opcional — usa `EVOLUTION_API_KEY` se vazia) |
| `WEBHOOK_BASE_URL` | URL que a Evolution usa para chamar o backend (`http://host.docker.internal:3333`) |
| `GEMINI_API_KEY` | Chave da API Gemini (IA) |
| `GEMINI_AUTO_REPLY` | `true` = IA responde automaticamente no webhook |
| `GOOGLE_CLIENT_ID/SECRET` | OAuth do Google Calendar |
| `FRONTEND_URL` | URL do frontend (`http://localhost:5173`) |
| `JWT_SECRET` | Segredo para assinar tokens JWT |
| `JWT_EXPIRES_IN` | Validade do token (ex.: `7d`) |
| `ADMIN_EMAIL` | E-mail do admin criado automaticamente se o banco estiver vazio |
| `ADMIN_PASSWORD` | Senha do admin inicial |

## Google Calendar (opcional)

1. Crie um projeto no [Google Cloud Console](https://console.cloud.google.com/)
2. Ative a **Google Calendar API**
3. Crie credenciais OAuth 2.0 (tipo: aplicativo web)
4. Redirect URI: `http://localhost:3333/google/callback`
5. Preencha `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env`
6. No painel, vá em **Agendamentos** e clique em conectar o Google Calendar

## IA / Gemini (opcional)

1. Gere uma chave em [Google AI Studio](https://aistudio.google.com/apikey)
2. Coloque em `GEMINI_API_KEY` no `.env`
3. Recomendado no plano gratuito: `GEMINI_MODEL=gemini-2.5-flash-lite`
4. Use o botão ✨ no chat para gerar respostas manualmente
5. Cadastre procedimentos em **Procedimentos** para a IA informar preços e duração

## Scripts úteis

```bash
# Backend
cd backend
npx tsx src/server.ts          # Rodar API
npx prisma studio              # Visualizar banco no navegador

# Frontend
cd frontend
npm run dev                    # Desenvolvimento
npm run build                  # Build de produção
```

## Problemas comuns

### Backend não conecta no banco
- Verifique se o Docker está rodando: `docker compose ps` (dentro de `docker/`)
- Confirme `DATABASE_URL` com porta **5433**

### Mensagens WhatsApp não chegam
- Instância conectada na tela `/whatsapp/setup` (QR Code escaneado)?
- Backend rodando na porta 3333?
- Containers do Docker no ar (`docker compose ps` em `docker/`)?
- O webhook é configurado automaticamente pelo backend; se precisar conferir manualmente, abra o manager em `http://localhost:8080/manager` e veja a URL `http://host.docker.internal:3333/webhook/whatsapp`

### QR Code não aparece em `/whatsapp/setup`
- Confirme que o container `evolution_api` está saudável
- Verifique no console do navegador se `/whatsapp/qrcode` retorna 401 (faça login como **admin**) ou 5xx (cheque o terminal do backend)
- Use o botão **Atualizar QR Code** após alguns segundos

### Conversas apagadas no celular ainda aparecem no painel
- Ative `CHATS_DELETE` (e opcionalmente `MESSAGES_DELETE`) no webhook da Evolution
- Para conversas antigas, passe o mouse na lista e clique no ícone de lixeira para remover do painel

### Erro ao enviar mensagem (@lid)
- Vincule o telefone real do contato pelo banner amarelo no chat

### Cota Gemini esgotada
- Use `gemini-2.5-flash-lite` no `.env`
- Mantenha `GEMINI_AUTO_REPLY=false` e use IA manualmente (botão ✨)

### `prisma generate` falha (Windows)
- Pare o backend antes de rodar `npx prisma generate` (libera o arquivo `.dll`)

## Segurança

Não suba para o GitHub:

- `backend/.env`
- `backend/src/config/google-token.json`
- `API Key.txt`
- Qualquer arquivo com senhas ou tokens

Use o [`.gitignore`](.gitignore) na raiz do projeto.

## Licença

Projeto privado / uso interno. Ajuste conforme sua necessidade.



