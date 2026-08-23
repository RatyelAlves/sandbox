# Bros

Encontros discretos entre homens gays. Apelido no lugar de nome, fotos privadas sob liberação, cidade sem GPS e botão **Clima** que troca a tela por uma página camuflada.

Só para maiores de 18 anos.

## Stack

Next.js (App Router), TypeScript, Tailwind e Supabase (Auth, Postgres, Storage, Realtime).

## Como rodar

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Authentication > Providers > Email**, desative *Confirm email* para testar local (ou deixe ligado e use o link do email).
3. Em **Authentication > URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
4. Copie `.env.example` para `.env.local` e preencha:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. No **SQL Editor**, cole e execute [`supabase/schema.sql`](supabase/schema.sql). Isso cria tabelas, RLS, bucket `photos` e Realtime no chat.
6. Instale e suba:

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Crie duas contas na mesma cidade para testar match e chat.

## Privacidade no MVP

- Sem login social (nada de Google/Facebook).
- Email nunca aparece no perfil.
- Modo discreto trava fotos de rosto.
- Fotos privadas só depois que o dono libera.
- Botão **Clima** (sempre visível quando logado) vai para `/camuflado`. Cinco toques no logo **ClimaHoje** voltam ao app.

## Scripts

```bash
npm run dev
npm run build
npm run start
```
