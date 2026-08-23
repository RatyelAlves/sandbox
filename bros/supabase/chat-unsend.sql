-- Cole no SQL Editor. Apagar foto/vídeo do chat em até 1 minuto.

drop policy if exists "messages_delete_own_media" on public.messages;
create policy "messages_delete_own_media"
  on public.messages for delete
  to authenticated
  using (
    sender_id = auth.uid()
    and attachment_path is not null
    and created_at > now() - interval '1 minute'
  );

grant delete on table public.messages to authenticated;

drop policy if exists "chat_storage_delete" on storage.objects;
create policy "chat_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'chat'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
