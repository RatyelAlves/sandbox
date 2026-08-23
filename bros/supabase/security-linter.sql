-- Cole no SQL Editor. Fecha os avisos de search_path e de SECURITY DEFINER
-- executável por anon / authenticated quando não precisa.

-- ---------------------------------------------------------------------------
-- search_path
-- ---------------------------------------------------------------------------

alter function public.set_updated_at() set search_path = public;

-- ---------------------------------------------------------------------------
-- Triggers: ninguém chama via /rest/v1/rpc
-- ---------------------------------------------------------------------------

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.delete_conversation_on_block() from public, anon, authenticated;
revoke all on function public.handle_mutual_like() from public, anon, authenticated;
revoke all on function public.lock_face_photos_on_discreet() from public, anon, authenticated;
revoke all on function public.notify_media_grants_inserted() from public, anon, authenticated;
revoke all on function public.unhide_on_message() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helpers e RPCs: RLS no lugar de DEFINER, quando der
-- ---------------------------------------------------------------------------

alter function public.is_blocked(uuid, uuid) security invoker;
alter function public.block_user(uuid) security invoker;

alter function public.report_screenshot_attempt() security invoker;

drop policy if exists "screenshot_blocks_insert" on public.screenshot_blocks;
create policy "screenshot_blocks_insert"
  on public.screenshot_blocks for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "screenshot_blocks_update" on public.screenshot_blocks;
create policy "screenshot_blocks_update"
  on public.screenshot_blocks for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on table public.screenshot_blocks to authenticated;

-- ---------------------------------------------------------------------------
-- API: sem anon, sem PUBLIC. Authenticated só no que o app chama.
-- ---------------------------------------------------------------------------

revoke all on function public.is_blocked(uuid, uuid) from public, anon;
revoke all on function public.conversation_with(uuid) from public, anon;
revoke all on function public.block_user(uuid) from public, anon;
revoke all on function public.start_conversation(uuid) from public, anon;
revoke all on function public.post_grant_notice(uuid, text, uuid)
  from public, anon, authenticated;
revoke all on function public.report_screenshot_attempt() from public, anon;

grant execute on function public.is_blocked(uuid, uuid) to authenticated;
grant execute on function public.conversation_with(uuid) to authenticated;
grant execute on function public.block_user(uuid) to authenticated;
grant execute on function public.start_conversation(uuid) to authenticated;
grant execute on function public.report_screenshot_attempt() to authenticated;
