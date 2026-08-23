-- Cole no SQL Editor. Marca conversa como lida (número de mensagens novas).

alter table public.conversation_members
  add column if not exists last_read_at timestamptz;

drop policy if exists "conversation_members_update" on public.conversation_members;
create policy "conversation_members_update"
  on public.conversation_members for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant update on table public.conversation_members to authenticated;
