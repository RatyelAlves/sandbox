-- Cole no SQL Editor do Supabase (projeto já existente).
-- Campos de perfil estilo Grindr + álbuns.

alter table public.profiles
  add column if not exists height_cm integer,
  add column if not exists weight_kg integer,
  add column if not exists body_type text,
  add column if not exists position text;

alter table public.profiles
  drop constraint if exists profiles_body_type_check;
alter table public.profiles
  add constraint profiles_body_type_check
  check (
    body_type is null
    or body_type in ('magro', 'atlético', 'médio', 'grande', 'musculoso')
  );

alter table public.profiles
  drop constraint if exists profiles_position_check;
alter table public.profiles
  add constraint profiles_position_check
  check (
    position is null
    or position in ('ativo', 'passivo', 'versátil')
  );

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  is_private boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists albums_user_id_idx on public.albums (user_id);

alter table public.photos
  add column if not exists album_id uuid references public.albums (id) on delete cascade;

create index if not exists photos_album_id_idx on public.photos (album_id);

alter table public.albums enable row level security;

drop policy if exists "albums_select" on public.albums;
create policy "albums_select"
  on public.albums for select
  to authenticated
  using (
    user_id = auth.uid()
    or not public.is_blocked(auth.uid(), user_id)
  );

drop policy if exists "albums_insert" on public.albums;
create policy "albums_insert"
  on public.albums for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "albums_update" on public.albums;
create policy "albums_update"
  on public.albums for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "albums_delete" on public.albums;
create policy "albums_delete"
  on public.albums for delete
  to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on table public.albums to authenticated;
