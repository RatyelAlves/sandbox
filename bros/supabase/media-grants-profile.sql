-- Cole no SQL Editor. Só abre a foto que ainda está liberada
-- (tudo, aquela foto, ou o álbum dela). Revogar fecha de novo.

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
