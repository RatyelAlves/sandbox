-- Cole no SQL Editor. Vídeo e localização no chat.

alter table public.messages
  add column if not exists loc_lat double precision,
  add column if not exists loc_lng double precision,
  add column if not exists loc_label text;

alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages
  add constraint messages_body_check
  check (
    char_length(body) <= 2000
    and (
      char_length(body) >= 1
      or attachment_path is not null
      or (loc_lat is not null and loc_lng is not null)
    )
  );

update storage.buckets
set
  file_size_limit = 31457280,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
where id = 'chat';
