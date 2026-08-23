-- Cole no SQL Editor. Tap some do número depois de ver o perfil.

alter table public.likes
  add column if not exists seen_at timestamptz;

drop policy if exists "likes_update_seen" on public.likes;
create policy "likes_update_seen"
  on public.likes for update
  to authenticated
  using (to_id = auth.uid())
  with check (to_id = auth.uid());

grant update on table public.likes to authenticated;
