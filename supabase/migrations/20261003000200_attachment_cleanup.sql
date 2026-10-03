create table public.attachment_cleanup (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_id uuid not null unique,
  created_at timestamptz not null default now(),
  last_error_at timestamptz
);
create index attachment_cleanup_user_idx on public.attachment_cleanup(user_id, created_at);
alter table public.attachment_cleanup enable row level security;
create policy owner_all on public.attachment_cleanup for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
