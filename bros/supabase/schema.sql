-- Bros — cole este arquivo no SQL Editor do Supabase (de uma vez).
-- Authentication > Providers > Email: desative "Confirm email" para testar local.
-- Authentication > URL Configuration:
--   Site URL: http://localhost:3000
--   Redirect URLs: http://localhost:3000/auth/callback

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  alias text not null unique,
  bio text not null default '',
  city text not null,
  age integer not null check (age >= 18 and age <= 99),
  looking_for text not null default 'encontros'
    check (looking_for in ('encontros', 'amizade', 'relacionamento', 'sem_pressa')),
  discreet_mode boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('face', 'body', 'other')),
  is_private boolean not null default true,
  path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.photo_grants (
  owner_id uuid not null references public.profiles (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, viewer_id),
  check (owner_id <> viewer_id)
);

create table if not exists public.photo_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (owner_id, requester_id),
  check (owner_id <> requester_id)
);

create table if not exists public.likes (
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id),
  check (from_id <> to_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);

create index if not exists profiles_city_idx on public.profiles (city);
create index if not exists photos_user_id_idx on public.photos (user_id);
create index if not exists likes_to_id_idx on public.likes (to_id);
create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at desc);
create index if not exists conversation_members_user_idx
  on public.conversation_members (user_id);
create index if not exists photo_requests_owner_idx on public.photo_requests (owner_id);
create index if not exists blocks_blocked_idx on public.blocks (blocked_id);

-- ---------------------------------------------------------------------------
-- Schema interno (fora da API PostgREST)
-- ---------------------------------------------------------------------------

create schema if not exists private;
revoke all on schema private from public;
revoke usage on schema private from anon;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Funções
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.is_blocked(a uuid, b uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function public.handle_mutual_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conv_id uuid;
begin
  if exists (
    select 1 from public.likes
    where from_id = new.to_id and to_id = new.from_id
  ) then
    select c.id into conv_id
    from public.conversations c
    join public.conversation_members m1
      on m1.conversation_id = c.id and m1.user_id = new.from_id
    join public.conversation_members m2
      on m2.conversation_id = c.id and m2.user_id = new.to_id
    limit 1;

    if conv_id is null then
      insert into public.conversations default values
      returning id into conv_id;

      insert into public.conversation_members (conversation_id, user_id)
      values (conv_id, new.from_id), (conv_id, new.to_id);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists likes_mutual_conversation on public.likes;
create trigger likes_mutual_conversation
  after insert on public.likes
  for each row execute function public.handle_mutual_like();

create or replace function private.in_conversation(conv uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = conv and user_id = auth.uid()
  );
$$;

create or replace function public.conversation_with(other uuid)
returns uuid
language sql
stable
security invoker
set search_path = public
as $$
  select c.id
  from public.conversations c
  join public.conversation_members a
    on a.conversation_id = c.id and a.user_id = auth.uid()
  join public.conversation_members b
    on b.conversation_id = c.id and b.user_id = other
  limit 1;
$$;

create or replace function public.lock_face_photos_on_discreet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.discreet_mode = true then
    update public.photos
      set is_private = true
      where user_id = new.id and kind = 'face';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_lock_face_photos on public.profiles;
create trigger profiles_lock_face_photos
  after update of discreet_mode on public.profiles
  for each row execute function public.lock_face_photos_on_discreet();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.photos enable row level security;
alter table public.photo_grants enable row level security;
alter table public.photo_requests enable row level security;
alter table public.likes enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

-- profiles
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or not public.is_blocked(auth.uid(), id)
  );

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- photos
-- Metadados da foto são visíveis (para mostrar o cadeado). O arquivo no Storage continua protegido.
drop policy if exists "photos_select" on public.photos;
create policy "photos_select"
  on public.photos for select
  to authenticated
  using (
    user_id = auth.uid()
    or not public.is_blocked(auth.uid(), user_id)
  );

drop policy if exists "photos_insert" on public.photos;
create policy "photos_insert"
  on public.photos for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "photos_update" on public.photos;
create policy "photos_update"
  on public.photos for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "photos_delete" on public.photos;
create policy "photos_delete"
  on public.photos for delete
  to authenticated
  using (user_id = auth.uid());

-- photo_grants
drop policy if exists "photo_grants_select" on public.photo_grants;
create policy "photo_grants_select"
  on public.photo_grants for select
  to authenticated
  using (owner_id = auth.uid() or viewer_id = auth.uid());

drop policy if exists "photo_grants_insert" on public.photo_grants;
create policy "photo_grants_insert"
  on public.photo_grants for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "photo_grants_delete" on public.photo_grants;
create policy "photo_grants_delete"
  on public.photo_grants for delete
  to authenticated
  using (owner_id = auth.uid());

-- photo_requests
drop policy if exists "photo_requests_select" on public.photo_requests;
create policy "photo_requests_select"
  on public.photo_requests for select
  to authenticated
  using (owner_id = auth.uid() or requester_id = auth.uid());

drop policy if exists "photo_requests_insert" on public.photo_requests;
create policy "photo_requests_insert"
  on public.photo_requests for insert
  to authenticated
  with check (requester_id = auth.uid());

drop policy if exists "photo_requests_update" on public.photo_requests;
create policy "photo_requests_update"
  on public.photo_requests for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- likes
drop policy if exists "likes_select" on public.likes;
create policy "likes_select"
  on public.likes for select
  to authenticated
  using (from_id = auth.uid() or to_id = auth.uid());

drop policy if exists "likes_insert" on public.likes;
create policy "likes_insert"
  on public.likes for insert
  to authenticated
  with check (from_id = auth.uid());

drop policy if exists "likes_delete" on public.likes;
create policy "likes_delete"
  on public.likes for delete
  to authenticated
  using (from_id = auth.uid());

-- conversations
drop policy if exists "conversations_select" on public.conversations;
create policy "conversations_select"
  on public.conversations for select
  to authenticated
  using (private.in_conversation(id));

-- conversation_members
drop policy if exists "conversation_members_select" on public.conversation_members;
create policy "conversation_members_select"
  on public.conversation_members for select
  to authenticated
  using (private.in_conversation(conversation_id));

-- messages
drop policy if exists "messages_select" on public.messages;
create policy "messages_select"
  on public.messages for select
  to authenticated
  using (private.in_conversation(conversation_id));

drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and private.in_conversation(conversation_id)
  );

-- blocks
drop policy if exists "blocks_select" on public.blocks;
create policy "blocks_select"
  on public.blocks for select
  to authenticated
  using (blocker_id = auth.uid() or blocked_id = auth.uid());

drop policy if exists "blocks_insert" on public.blocks;
create policy "blocks_insert"
  on public.blocks for insert
  to authenticated
  with check (blocker_id = auth.uid());

drop policy if exists "blocks_delete" on public.blocks;
create policy "blocks_delete"
  on public.blocks for delete
  to authenticated
  using (blocker_id = auth.uid());

-- reports
drop policy if exists "reports_insert" on public.reports;
create policy "reports_insert"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

drop policy if exists "reports_select" on public.reports;
create policy "reports_select"
  on public.reports for select
  to authenticated
  using (reporter_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant usage on schema public to authenticated, anon;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.photos to authenticated;
grant select, insert, delete on table public.photo_grants to authenticated;
grant select, insert, update on table public.photo_requests to authenticated;
grant select, insert, delete on table public.likes to authenticated;
grant select on table public.conversations to authenticated;
grant select on table public.conversation_members to authenticated;
grant select, insert on table public.messages to authenticated;
grant select, insert, delete on table public.blocks to authenticated;
grant select, insert on table public.reports to authenticated;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_mutual_like() from public, anon, authenticated;
revoke all on function public.lock_face_photos_on_discreet() from public, anon, authenticated;
revoke all on function public.conversation_with(uuid) from public, anon;
revoke all on function public.is_blocked(uuid, uuid) from public, anon;
revoke all on function private.in_conversation(uuid) from public, anon;

grant execute on function public.conversation_with(uuid) to authenticated;
grant execute on function public.is_blocked(uuid, uuid) to authenticated;
grant execute on function private.in_conversation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter table public.messages replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "photos_storage_insert" on storage.objects;
create policy "photos_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "photos_storage_update" on storage.objects;
create policy "photos_storage_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "photos_storage_delete" on storage.objects;
create policy "photos_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "photos_storage_select" on storage.objects;
create policy "photos_storage_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.photos p
        where p.path = name
          and (
            exists (
              select 1 from public.photo_grants g
              where g.owner_id = p.user_id and g.viewer_id = auth.uid()
            )
            or (
              p.is_private = false
              and p.kind <> 'face'
            )
            or (
              p.is_private = false
              and p.kind = 'face'
              and exists (
                select 1 from public.profiles pr
                where pr.id = p.user_id and pr.discreet_mode = false
              )
            )
          )
      )
    )
  );
