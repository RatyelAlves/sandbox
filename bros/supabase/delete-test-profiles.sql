-- Apaga as contas de teste. Mantém Cotrax / C0tr4x.
-- Fotos já devem ser removidas pela API de Storage (não dá para apagar
-- direto em storage.objects).
-- Cole no SQL Editor do Supabase e execute.

delete from auth.users
where id in (
  select p.id
  from public.profiles p
  where lower(p.alias) not in ('cotrax', 'c0tr4x')
);
