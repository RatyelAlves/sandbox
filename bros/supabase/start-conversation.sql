-- Cole no SQL Editor. Permite abrir chat com outro usuário sem precisar de match.

create or replace function public.start_conversation(other uuid)
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
    return conv_id;
  end if;

  insert into public.conversations default values
  returning id into conv_id;

  insert into public.conversation_members (conversation_id, user_id)
  values (conv_id, auth.uid()), (conv_id, other);

  return conv_id;
end;
$$;

revoke all on function public.start_conversation(uuid) from public;
grant execute on function public.start_conversation(uuid) to authenticated;
