-- Cole no SQL Editor. Permite escolher a foto de perfil.

alter table public.profiles
  add column if not exists avatar_photo_id uuid references public.photos (id) on delete set null;
