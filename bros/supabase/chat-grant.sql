-- Cole no SQL Editor. Aviso no chat quando um álbum é liberado.
-- Rode depois de media-grants.sql e start-conversation.sql (ou chat-hide.sql).

alter table public.messages
  add column if not exists kind text not null default 'user';

alter table public.messages drop constraint if exists messages_kind_check;
alter table public.messages
  add constraint messages_kind_check
  check (kind in ('user', 'grant'));

create or replace function public.post_grant_notice(
  other uuid,
  notice text,
  conv uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  conv_id uuid;
  text_body text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if other is null or other = auth.uid() then
    raise exception 'invalid user';
  end if;

  if notice is null or length(trim(notice)) = 0 then
    raise exception 'empty notice';
  end if;

  text_body := left(trim(notice), 2000);

  if conv is not null then
    if exists (
      select 1
      from public.conversation_members a
      join public.conversation_members b
        on b.conversation_id = a.conversation_id
      where a.conversation_id = conv
        and a.user_id = auth.uid()
        and b.user_id = other
    ) then
      conv_id := conv;
    end if;
  end if;

  if conv_id is null then
    select c.id into conv_id
    from public.conversations c
    join public.conversation_members a
      on a.conversation_id = c.id and a.user_id = auth.uid()
    join public.conversation_members b
      on b.conversation_id = c.id and b.user_id = other
    order by coalesce(
      (select max(m.created_at) from public.messages m where m.conversation_id = c.id),
      '-infinity'::timestamptz
    ) desc
    limit 1;
  end if;

  if conv_id is null then
    insert into public.conversations default values
    returning id into conv_id;

    insert into public.conversation_members (conversation_id, user_id)
    values (conv_id, auth.uid()), (conv_id, other);
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'conversation_members'
      and column_name = 'hidden_at'
  ) then
    update public.conversation_members
    set hidden_at = null
    where conversation_id = conv_id
      and hidden_at is not null;
  end if;

  if exists (
    select 1
    from public.messages
    where conversation_id = conv_id
      and sender_id = auth.uid()
      and body = text_body
      and created_at > now() - interval '2 minutes'
  ) then
    return conv_id;
  end if;

  insert into public.messages (conversation_id, sender_id, body, kind)
  values (conv_id, auth.uid(), text_body, 'grant');

  return conv_id;
end;
$$;

revoke all on function public.post_grant_notice(uuid, text, uuid)
  from public, anon, authenticated;

revoke all on function public.notify_media_grants_inserted() from public, anon, authenticated;

create or replace function public.notify_media_grants_inserted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  notice text;
  titles text[];
begin
  for r in
    select
      i.viewer_id,
      bool_or(i.scope = 'all') as is_all,
      coalesce(
        array_agg(i.album_id) filter (where i.scope = 'album' and i.album_id is not null),
        '{}'
      ) as album_ids
    from inserted i
    where i.scope in ('all', 'album')
    group by i.viewer_id
  loop
    if r.is_all then
      notice := 'Liberou as fotos privadas';
    else
      select coalesce(array_agg(a.title order by a.created_at), '{}')
      into titles
      from public.albums a
      where a.id = any(r.album_ids);

      if coalesce(array_length(titles, 1), 0) = 0 then
        notice := 'Liberou um álbum';
      elsif array_length(titles, 1) = 1 then
        notice := 'Liberou o álbum ' || titles[1];
      elsif array_length(titles, 1) = 2 then
        notice := 'Liberou os álbuns ' || titles[1] || ' e ' || titles[2];
      else
        notice :=
          'Liberou os álbuns '
          || array_to_string(titles[1:array_length(titles, 1) - 1], ', ')
          || ' e '
          || titles[array_length(titles, 1)];
      end if;
    end if;

    begin
      perform public.post_grant_notice(r.viewer_id, notice, null);
    exception
      when others then
        null;
    end;
  end loop;

  return null;
end;
$$;

-- O aviso no chat agora sai só pelo app. Sem isso, Liberar manda duas linhas.
drop trigger if exists media_grants_notice on public.media_grants;
