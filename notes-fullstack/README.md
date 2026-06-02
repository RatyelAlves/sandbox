# App de Notas

Projeto fullstack para criar, editar, buscar e apagar notas.

**Stack:** React, TypeScript, Tailwind, Fastify, Prisma e SQLite.

## Pré-requisitos

- [Node.js](https://nodejs.org/) (versão LTS recente)
- PowerShell (Windows) ou terminal equivalente

## Rodar o projeto

### Primeira vez

1. Copie os arquivos de ambiente:

```powershell
Copy-Item server\.env.example server\.env
Copy-Item web\.env.example web\.env
```

2. Na raiz do projeto, instale dependências e prepare o banco:

```powershell
npm install
npm run setup
```

3. Suba frontend e backend:

```powershell
npm run dev
```

### URLs

- Frontend: http://localhost:5173
- Backend (API): http://localhost:8080

Acesse sempre pelo **frontend** (`5173`). Em desenvolvimento, o Vite faz proxy de `/api` para o backend na porta `8080`.

### Rodar separado

Se preferir (ou se um dos processos cair no Windows), use dois terminais:

**Backend:**

```powershell
Set-Location server
npm install
npx prisma migrate deploy
npm run dev
```

**Frontend:**

```powershell
Set-Location web
npm install
npm run dev
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Sobe frontend e backend juntos |
| `npm run setup` | Instala dependências e roda migrations |
| `npm run test` | Executa os testes |
| `npm run build` | Build de produção do frontend |

## Estrutura

- `server/` — API REST (Fastify + Prisma + SQLite)
- `web/` — interface React (Vite)

## Solução de problemas

### "Network Error" no app

Esse erro aparece quando o frontend não consegue falar com a API. Confira:

1. **Os dois serviços estão rodando?** No terminal devem aparecer:
   - `HTTP server run on http://localhost:8080`
   - `Local: http://localhost:5173/`

2. **Reinicie tudo:** pare com `Ctrl+C` e rode `npm run dev` de novo.

3. **Teste a API no PowerShell:**

```powershell
Invoke-RestMethod http://localhost:8080/notes
Invoke-RestMethod http://localhost:5173/api/notes
```

Os dois comandos devem retornar JSON. Se o primeiro falhar, o backend está parado. Se o segundo falhar, o frontend ou o proxy não estão ativos.

4. **Arquivos `.env`:** confirme que existem `server\.env` e `web\.env` (copiados dos `.env.example`).

### Migrations / banco

Se o backend não iniciar por erro de banco:

```powershell
Set-Location server
npx prisma migrate deploy
```

## Observação

Não commitar `.env`, `node_modules/` nem arquivos `.db`.
