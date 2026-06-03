# EstheticFlow Desktop

App Windows **independente** — inclui backend, frontend, WhatsApp (Evolution) e banco SQLite. Não depende do projeto Web.

> Versão navegador (PostgreSQL + Docker): [`../EstheticFlow-Web`](../EstheticFlow-Web)

## Estrutura

```
EstheticFlow-Desktop/
  backend/       API (SQLite no app instalado)
  frontend/      React (build embutido no .exe)
  electron/      Janela + serviços locais
  scripts/       Build e bootstrap
  package.json
```

## Desenvolvimento

```powershell
cd EstheticFlow-Desktop
npm install
cd backend && copy .env.example .env && npm install && cd ..
cd frontend && npm install && cd ..
npm run dev
```

Sobe backend (:3333), frontend (:5173) e Electron.

## Gerar instalador

Precisa de **Docker Desktop** só na máquina de *build* (copia Evolution para o pacote).

```powershell
cd EstheticFlow-Desktop
npm install
npm run dist          # EstheticFlow-Setup-1.0.0.exe
npm run dist:zip      # ZIP portable (melhor em notebooks fracos)
```

Saída em `release/`.

## Na máquina do usuário

1. Instale ou extraia o `.exe` / ZIP
2. Login: `admin@estheticflow.local` / `admin123`
3. Escaneie o QR Code do WhatsApp

Sem Docker, sem Node, sem terminal na máquina de destino.
