-- Cole no SQL Editor. Anexos de foto no chat (só os dois da conversa veem).

alter table public.messages
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists attachment_mime text;

alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages
  add constraint messages_body_check
  check (
    char_length(body) <= 2000
    and (
      char_length(body) >= 1
      or attachment_path is not null
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat',
  'chat',
  false,
  31457280,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "chat_storage_insert" on storage.objects;
create policy "chat_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat'
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1 from public.conversation_members m
      where m.user_id = auth.uid()
        and m.conversation_id::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "chat_storage_select" on storage.objects;
create policy "chat_storage_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'chat'
    and exists (
      select 1 from public.conversation_members m
      where m.user_id = auth.uid()
        and m.conversation_id::text = (storage.foldername(name))[1]
    )
  );
