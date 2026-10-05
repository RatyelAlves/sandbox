-- Trava a Data API (PostgREST) nas tabelas do Prisma.
-- O app continua acessando via Prisma (role postgres), que ignora RLS
-- enquanto FORCE ROW LEVEL SECURITY não estiver ligado.

alter table public."User" enable row level security;
alter table public."Terreiro" enable row level security;
alter table public."Evento" enable row level security;
alter table public."Campanha" enable row level security;
alter table public."PropostaCampanha" enable row level security;
alter table public."FavoritoTerreiro" enable row level security;
alter table public."FavoritoEvento" enable row level security;

revoke all on table public."User" from anon, authenticated;
revoke all on table public."Terreiro" from anon, authenticated;
revoke all on table public."Evento" from anon, authenticated;
revoke all on table public."Campanha" from anon, authenticated;
revoke all on table public."PropostaCampanha" from anon, authenticated;
revoke all on table public."FavoritoTerreiro" from anon, authenticated;
revoke all on table public."FavoritoEvento" from anon, authenticated;

revoke all on all sequences in schema public from anon, authenticated;

alter default privileges in schema public
  revoke all on tables from anon, authenticated;

alter default privileges in schema public
  revoke all on sequences from anon, authenticated;
