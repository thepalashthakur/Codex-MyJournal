-- Apply after S3Sync's public.files migration, in the same Supabase project.
create extension if not exists pgcrypto;

create table public.journal_collections (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100), position integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create table public.journals (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  collection_id uuid, name text not null check (length(trim(name)) between 1 and 100),
  description text, color text not null default '#a88767', icon text not null default 'book',
  position integer not null default 0, archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (collection_id, user_id) references public.journal_collections(id, user_id) on delete set null (collection_id)
);
create table public.locations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  place_name text, locality text, region text, country text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  source text not null default 'manual', created_at timestamptz not null default now(), unique (id, user_id)
);
create table public.entries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  journal_id uuid not null, title text not null default '',
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}',
  content_format text not null default 'tiptap-json', content_version integer not null default 1,
  content_text text not null default '', revision integer not null default 1,
  entry_date timestamptz not null, local_date date not null, timezone text not null,
  is_favorite boolean not null default false, is_pinned boolean not null default false,
  location_id uuid, weather_data jsonb, metadata jsonb not null default '{}',
  source_type text not null default 'WEB', source_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique (id, user_id),
  foreign key (journal_id, user_id) references public.journals(id, user_id),
  foreign key (location_id, user_id) references public.locations(id, user_id),
  unique (user_id, source_type, source_id)
);
create table public.tags (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 60),
  normalized_name text generated always as (lower(trim(name))) stored,
  created_at timestamptz not null default now(), unique (id, user_id), unique (user_id, normalized_name)
);
create table public.entry_tags (
  user_id uuid not null references auth.users(id) on delete cascade, entry_id uuid not null, tag_id uuid not null,
  primary key (entry_id, tag_id),
  foreign key (entry_id, user_id) references public.entries(id, user_id) on delete cascade,
  foreign key (tag_id, user_id) references public.tags(id, user_id) on delete cascade
);
create unique index if not exists files_id_user_unique on public.files(id, user_id);
create table public.attachments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null, file_id uuid not null unique, type text not null check (type in ('IMAGE','VIDEO','AUDIO','DOCUMENT','PDF','DRAWING','OTHER')),
  file_name text not null, mime_type text not null, size_bytes bigint not null check (size_bytes > 0),
  caption text, width integer, height integer, duration_seconds integer,
  created_at timestamptz not null default now(),
  foreign key (entry_id, user_id) references public.entries(id, user_id) on delete cascade,
  foreign key (file_id, user_id) references public.files(id, user_id)
);
create table public.entry_templates (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  journal_id uuid, name text not null check (length(trim(name)) between 1 and 100),
  content jsonb not null, content_format text not null default 'tiptap-json',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (journal_id, user_id) references public.journals(id, user_id) on delete set null (journal_id)
);
create table public.prompts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (length(trim(text)) between 1 and 500), category text,
  created_at timestamptz not null default now()
);
create table public.journal_reminders (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  journal_id uuid, local_time time not null, days_of_week integer[] not null default '{0,1,2,3,4,5,6}',
  timezone text not null, enabled boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (journal_id, user_id) references public.journals(id, user_id) on delete set null (journal_id)
);

create index entries_timeline_idx on public.entries(user_id, local_date desc, entry_date desc, id desc) where deleted_at is null;
create index entries_journal_idx on public.entries(user_id, journal_id, local_date desc) where deleted_at is null;
create index entries_favorite_idx on public.entries(user_id, local_date desc) where is_favorite and deleted_at is null;
create index entries_search_idx on public.entries using gin (to_tsvector('simple', coalesce(title,'') || ' ' || content_text));
create index entries_memories_idx on public.entries(user_id, (extract(month from local_date)), (extract(day from local_date))) where deleted_at is null;
create index attachments_entry_idx on public.attachments(entry_id);
create index attachments_user_idx on public.attachments(user_id, created_at desc);
create index journals_user_idx on public.journals(user_id, position) where archived_at is null;
create index entry_tags_user_tag_idx on public.entry_tags(user_id, tag_id);

alter table public.journal_collections enable row level security;
alter table public.journals enable row level security;
alter table public.locations enable row level security;
alter table public.entries enable row level security;
alter table public.tags enable row level security;
alter table public.entry_tags enable row level security;
alter table public.attachments enable row level security;
alter table public.entry_templates enable row level security;
alter table public.prompts enable row level security;
alter table public.journal_reminders enable row level security;

create policy owner_all on public.journal_collections for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner_all on public.journals for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner_all on public.locations for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner_all on public.entries for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner_all on public.tags for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner_all on public.entry_tags for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner_all on public.attachments for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner_all on public.entry_templates for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner_all on public.prompts for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner_all on public.journal_reminders for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Atomic compare-and-swap autosave prevents stale tabs or reordered requests from overwriting a newer draft.
create or replace function public.save_entry(
  p_entry_id uuid, p_expected_revision integer, p_title text, p_content jsonb,
  p_content_text text, p_entry_date timestamptz, p_local_date date, p_timezone text,
  p_journal_id uuid, p_is_favorite boolean
) returns public.entries language plpgsql security invoker as $$
declare result public.entries;
begin
  update public.entries set title = p_title, content = p_content,
    content_text = p_content_text, entry_date = p_entry_date,
    local_date = p_local_date, timezone = p_timezone, journal_id = p_journal_id,
    is_favorite = p_is_favorite, revision = revision + 1, updated_at = now()
  where id = p_entry_id and user_id = auth.uid() and revision = p_expected_revision and deleted_at is null
  returning * into result;
  if not found then raise exception 'ENTRY_VERSION_CONFLICT' using errcode = 'P0001'; end if;
  return result;
end; $$;
