-- Cole no SQL Editor. Bloquear grava de verdade, some do Explorar e apaga o chat.

create or replace function public.delete_conversation_on_block()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conv_ids uuid[];
begin
  select coalesce(array_agg(c.id), '{}')
  into conv_ids
  from public.conversations c
  join public.conversation_members a
    on a.conversation_id = c.id and a.user_id = new.blocker_id
  join public.conversation_members b
    on b.conversation_id = c.id and b.user_id = new.blocked_id;

  if conv_ids = '{}' then
    return new;
  end if;

  begin
    delete from storage.objects
    where bucket_id = 'chat'
      and split_part(name, '/', 1) = any (select unnest(conv_ids)::text);
  exception
    when others then
      null;
  end;

  begin
    delete from public.conversations
    where id = any (conv_ids);
  exception
    when others then
      null;
  end;

  return new;
end;
$$;

drop trigger if exists blocks_delete_conversation on public.blocks;
create trigger blocks_delete_conversation
  after insert on public.blocks
  for each row execute function public.delete_conversation_on_block();

create or replace function public.block_user(other uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null or other is null or other = auth.uid() then
    raise exception 'invalid user';
  end if;

  insert into public.blocks (blocker_id, blocked_id)
  values (auth.uid(), other)
  on conflict do nothing;
end;
$$;

revoke all on function public.delete_conversation_on_block() from public, anon, authenticated;
revoke all on function public.block_user(uuid) from public, anon;
grant execute on function public.block_user(uuid) to authenticated;

-- Quem te bloqueou some. Quem você bloqueou continua visível só para você gerenciar.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or not exists (
      select 1 from public.blocks
      where blocker_id = profiles.id
        and blocked_id = auth.uid()
    )
  );
