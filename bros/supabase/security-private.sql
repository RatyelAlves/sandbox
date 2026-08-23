-- Cole no SQL Editor. Tira os 3 avisos de SECURITY DEFINER na API.
-- O de senha vazada no Free não some — só no plano Pro.

create schema if not exists private;
revoke all on schema private from public;
revoke usage on schema private from anon;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- in_conversation: some da API, fica só nas políticas
-- ---------------------------------------------------------------------------

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

revoke all on function private.in_conversation(uuid) from public, anon;
grant execute on function private.in_conversation(uuid) to authenticated;

drop policy if exists "conversations_select" on public.conversations;
create policy "conversations_select"
  on public.conversations for select
  to authenticated
  using (private.in_conversation(id));

drop policy if exists "conversation_members_select" on public.conversation_members;
create policy "conversation_members_select"
  on public.conversation_members for select
  to authenticated
  using (private.in_conversation(conversation_id));

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

drop function if exists public.in_conversation(uuid);

-- ---------------------------------------------------------------------------
-- start_conversation: DEFINER interno, RPC pública só encaminha
-- ---------------------------------------------------------------------------

create or replace function private.start_conversation(other uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  conv_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if other is null or other = auth.uid() then
    raise exception 'invalid user';
  end if;

  if public.is_blocked(auth.uid(), other) then
    raise exception 'blocked';
  end if;

  if not exists (select 1 from public.profiles where id = other) then
    raise exception 'not found';
  end if;

  select c.id into conv_id
  from public.conversations c
  join public.conversation_members a
    on a.conversation_id = c.id and a.user_id = auth.uid()
  join public.conversation_members b
    on b.conversation_id = c.id and b.user_id = other
  limit 1;

  if conv_id is not null then
    update public.conversation_members
    set hidden_at = null
    where conversation_id = conv_id
      and user_id = auth.uid();
    return conv_id;
  end if;

  insert into public.conversations default values
  returning id into conv_id;

  insert into public.conversation_members (conversation_id, user_id)
  values (conv_id, auth.uid()), (conv_id, other);

  return conv_id;
end;
$$;

revoke all on function private.start_conversation(uuid) from public, anon;
grant execute on function private.start_conversation(uuid) to authenticated;

create or replace function public.start_conversation(other uuid)
returns uuid
language sql
security invoker
set search_path = private, public
as $$
  select private.start_conversation(other);
$$;

revoke all on function public.start_conversation(uuid) from public, anon;
grant execute on function public.start_conversation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- post_grant_notice: o app não chama mais
-- ---------------------------------------------------------------------------

revoke all on function public.post_grant_notice(uuid, text, uuid)
  from public, anon, authenticated;
