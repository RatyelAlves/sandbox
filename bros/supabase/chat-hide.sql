-- Cole no SQL Editor. Apagar conversa some só da sua lista.

alter table public.conversation_members
  add column if not exists hidden_at timestamptz;

drop policy if exists "conversation_members_update" on public.conversation_members;
create policy "conversation_members_update"
  on public.conversation_members for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant update on table public.conversation_members to authenticated;

create or replace function public.unhide_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversation_members
  set hidden_at = null
  where conversation_id = new.conversation_id
    and user_id <> new.sender_id
    and hidden_at is not null;
  return new;
end;
$$;

drop trigger if exists messages_unhide on public.messages;
create trigger messages_unhide
  after insert on public.messages
  for each row execute function public.unhide_on_message();

create schema if not exists private;
revoke all on schema private from public;
revoke usage on schema private from anon;
grant usage on schema private to authenticated;

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

create or replace function public.start_conversation(other uuid)
returns uuid
language sql
security invoker
set search_path = private, public
as $$
  select private.start_conversation(other);
$$;

revoke all on function public.unhide_on_message() from public, anon, authenticated;
revoke all on function private.start_conversation(uuid) from public, anon;
revoke all on function public.start_conversation(uuid) from public, anon;
grant execute on function private.start_conversation(uuid) to authenticated;
grant execute on function public.start_conversation(uuid) to authenticated;
