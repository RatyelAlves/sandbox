-- Cole no SQL Editor depois de schema.sql e profile-albums.sql.
-- Libera foto única, álbum ou tudo para outro usuário.

create table if not exists public.media_grants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  scope text not null check (scope in ('all', 'album', 'photo')),
  album_id uuid references public.albums (id) on delete cascade,
  photo_id uuid references public.photos (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (owner_id <> viewer_id),
  check (
    (scope = 'all' and album_id is null and photo_id is null)
    or (scope = 'album' and album_id is not null and photo_id is null)
    or (scope = 'photo' and photo_id is not null and album_id is null)
  )
);

create unique index if not exists media_grants_all_idx
  on public.media_grants (owner_id, viewer_id)
  where scope = 'all';

create unique index if not exists media_grants_album_idx
  on public.media_grants (owner_id, viewer_id, album_id)
  where scope = 'album';

create unique index if not exists media_grants_photo_idx
  on public.media_grants (owner_id, viewer_id, photo_id)
  where scope = 'photo';

create index if not exists media_grants_viewer_idx
  on public.media_grants (viewer_id);

alter table public.media_grants enable row level security;

drop policy if exists "media_grants_select" on public.media_grants;
create policy "media_grants_select"
  on public.media_grants for select
  to authenticated
  using (owner_id = auth.uid() or viewer_id = auth.uid());

drop policy if exists "media_grants_insert" on public.media_grants;
create policy "media_grants_insert"
  on public.media_grants for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "media_grants_delete" on public.media_grants;
create policy "media_grants_delete"
  on public.media_grants for delete
  to authenticated
  using (owner_id = auth.uid());

grant select, insert, delete on table public.media_grants to authenticated;

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
            or exists (
              select 1 from public.media_grants g
              where g.owner_id = p.user_id
                and g.viewer_id = auth.uid()
                and (
                  g.scope = 'all'
                  or (g.scope = 'photo' and g.photo_id = p.id)
                  or (g.scope = 'album' and g.album_id = p.album_id)
                )
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
