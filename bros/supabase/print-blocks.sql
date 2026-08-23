-- Cole no SQL Editor. Bloqueia a conta por 24h após tentativa de print.

create table if not exists public.screenshot_blocks (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  blocked_until timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.screenshot_blocks enable row level security;

drop policy if exists "screenshot_blocks_select" on public.screenshot_blocks;
create policy "screenshot_blocks_select"
  on public.screenshot_blocks for select
  to authenticated
  using (user_id = auth.uid());

grant select on table public.screenshot_blocks to authenticated;

drop policy if exists "screenshot_blocks_insert" on public.screenshot_blocks;
create policy "screenshot_blocks_insert"
  on public.screenshot_blocks for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "screenshot_blocks_update" on public.screenshot_blocks;
create policy "screenshot_blocks_update"
  on public.screenshot_blocks for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on table public.screenshot_blocks to authenticated;

create or replace function public.report_screenshot_attempt()
returns timestamptz
language plpgsql
security invoker
set search_path = public
as $$
declare
  until_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  until_at := now() + interval '24 hours';

  insert into public.screenshot_blocks (user_id, blocked_until)
  values (auth.uid(), until_at)
  on conflict (user_id) do update
    set blocked_until = greatest(public.screenshot_blocks.blocked_until, until_at);

  select blocked_until into until_at
  from public.screenshot_blocks
  where user_id = auth.uid();

  return until_at;
end;
$$;

revoke all on function public.report_screenshot_attempt() from public, anon;
grant execute on function public.report_screenshot_attempt() to authenticated;
