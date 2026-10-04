-- Apply after the existing journal migrations. Existing entries.content is untouched.
create table public.entry_sections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null,
  title text not null default '' check (length(title) <= 200),
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}',
  content_format text not null default 'tiptap-json',
  content_version integer not null default 1,
  content_text text not null default '' check (length(content_text) <= 500000),
  revision integer not null default 1 check (revision > 0),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, user_id),
  foreign key (entry_id, user_id) references public.entries(id, user_id) on delete cascade
);
create index entry_sections_entry_idx on public.entry_sections(user_id, entry_id, position, id) where deleted_at is null;
create index entry_sections_text_idx on public.entry_sections using gin (to_tsvector('simple', content_text)) where deleted_at is null;

-- Global read-only catalog. Each user's editable library is copied from these rows.
create table public.journal_emotion_catalog (
  code text primary key,
  parent_code text references public.journal_emotion_catalog(code),
  name text not null,
  color text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  position integer not null
);
insert into public.journal_emotion_catalog(code,parent_code,name,color,position) values
  ('happy',null,'Happy','#D49420',1),('sad',null,'Sad','#5379A8',2),
  ('angry',null,'Angry','#C46153',3),('fearful',null,'Fearful','#8C6BAD',4),
  ('surprised',null,'Surprised','#5A9A92',5),('disgusted',null,'Disgusted','#78845B',6),
  ('joyful','happy','Joyful','#D49420',1),('optimistic','happy','Optimistic','#D49420',2),
  ('proud','happy','Proud','#D49420',3),('playful','joyful','Playful','#D49420',1),
  ('delighted','joyful','Delighted','#D49420',2),('hopeful','optimistic','Hopeful','#D49420',1),
  ('lonely','sad','Lonely','#5379A8',1),('disappointed','sad','Disappointed','#5379A8',2),
  ('hurt','sad','Hurt','#5379A8',3),('isolated','lonely','Isolated','#5379A8',1),
  ('let-down','disappointed','Let down','#5379A8',1),
  ('frustrated','angry','Frustrated','#C46153',1),('resentful','angry','Resentful','#C46153',2),
  ('furious','angry','Furious','#C46153',3),('annoyed','frustrated','Annoyed','#C46153',1),
  ('irritated','frustrated','Irritated','#C46153',2),
  ('anxious','fearful','Anxious','#8C6BAD',1),('insecure','fearful','Insecure','#8C6BAD',2),
  ('overwhelmed','anxious','Overwhelmed','#8C6BAD',1),('worried','anxious','Worried','#8C6BAD',2),
  ('amazed','surprised','Amazed','#5A9A92',1),('confused','surprised','Confused','#5A9A92',2),
  ('inspired','amazed','Inspired','#5A9A92',1),
  ('repelled','disgusted','Repelled','#78845B',1),('uneasy','disgusted','Uneasy','#78845B',2),
  ('averse','repelled','Averse','#78845B',1);

create table public.journal_emotion_library_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  initialized_at timestamptz not null default now()
);
create table public.journal_emotions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  catalog_code text references public.journal_emotion_catalog(code),
  parent_id uuid,
  name text not null check (length(trim(name)) between 1 and 80),
  normalized_name text generated always as (lower(trim(name))) stored,
  color text not null default '#7A8291' check (color ~ '^#[0-9a-fA-F]{6}$'),
  is_system boolean not null default false,
  is_hidden boolean not null default false,
  archived_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, user_id),
  foreign key (parent_id, user_id) references public.journal_emotions(id, user_id)
);
create unique index journal_emotions_active_name_idx on public.journal_emotions(user_id, normalized_name) where archived_at is null and deleted_at is null;
create index journal_emotions_parent_idx on public.journal_emotions(user_id, parent_id, position) where deleted_at is null;

create function public.validate_journal_emotion_tree() returns trigger language plpgsql as $$
declare ancestor_depth integer := 0; descendant_depth integer := 0; cycle_found boolean := false;
begin
  if new.parent_id is not null then
    with recursive ancestors as (
      select id,parent_id,1 as depth from public.journal_emotions where id=new.parent_id and user_id=new.user_id
      union all
      select p.id,p.parent_id,a.depth+1 from public.journal_emotions p join ancestors a on p.id=a.parent_id and p.user_id=new.user_id where a.depth < 4
    ) select coalesce(max(depth),0), coalesce(bool_or(id=new.id),false) into ancestor_depth,cycle_found from ancestors;
    if ancestor_depth = 0 or cycle_found then raise exception 'Invalid emotion parent or cycle.'; end if;
    if exists (select 1 from public.journal_emotions where id=new.parent_id and archived_at is not null) then raise exception 'Cannot place an emotion under an archived parent.'; end if;
  end if;
  if tg_op = 'UPDATE' then
    with recursive descendants as (
      select id,1 as depth from public.journal_emotions where parent_id=new.id and user_id=new.user_id and deleted_at is null
      union all
      select c.id,d.depth+1 from public.journal_emotions c join descendants d on c.parent_id=d.id and c.user_id=new.user_id where d.depth < 4 and c.deleted_at is null
    ) select coalesce(max(depth),0) into descendant_depth from descendants;
  end if;
  if ancestor_depth + descendant_depth + 1 > 3 then raise exception 'Emotion hierarchy is limited to three levels.'; end if;
  return new;
end; $$;
create trigger validate_journal_emotion_tree before insert or update of parent_id on public.journal_emotions
  for each row execute function public.validate_journal_emotion_tree();

create table public.section_emotions (
  section_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  emotion_id uuid not null,
  intensity integer check (intensity between 1 and 10),
  emotion_name text not null,
  emotion_color text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (section_id, user_id) references public.entry_sections(id, user_id) on delete cascade,
  foreign key (emotion_id, user_id) references public.journal_emotions(id, user_id)
);
create index section_emotions_emotion_idx on public.section_emotions(user_id, emotion_id, intensity, section_id);
create index section_emotions_recent_idx on public.section_emotions(user_id, updated_at desc);

create table public.impact_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  normalized_name text generated always as (lower(trim(name))) stored,
  color text not null default '#7A8291' check (color ~ '^#[0-9a-fA-F]{6}$'),
  position integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create unique index impact_areas_name_idx on public.impact_areas(user_id, normalized_name) where archived_at is null;
create index impact_areas_user_idx on public.impact_areas(user_id, position);
create table public.impact_entities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 80),
  normalized_name text generated always as (lower(trim(name))) stored,
  position integer not null default 0,
  archived_at timestamptz,
  source_type text,
  external_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id), unique (id, area_id, user_id),
  foreign key (area_id, user_id) references public.impact_areas(id, user_id)
);
create unique index impact_entities_name_idx on public.impact_entities(user_id, area_id, normalized_name) where archived_at is null;
create index impact_entities_area_idx on public.impact_entities(user_id, area_id, position);

create table public.section_impact_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  section_id uuid not null,
  area_id uuid not null,
  area_name text not null,
  area_color text not null,
  created_at timestamptz not null default now(),
  unique (id, user_id, area_id), unique (section_id, area_id),
  foreign key (section_id, user_id) references public.entry_sections(id, user_id) on delete cascade,
  foreign key (area_id, user_id) references public.impact_areas(id, user_id)
);
create index section_impact_areas_area_idx on public.section_impact_areas(user_id, area_id, section_id);
create table public.section_impact_entities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  section_impact_area_id uuid not null,
  area_id uuid not null,
  entity_id uuid not null,
  entity_name text not null,
  created_at timestamptz not null default now(),
  unique (section_impact_area_id, entity_id),
  foreign key (section_impact_area_id, user_id, area_id) references public.section_impact_areas(id, user_id, area_id) on delete cascade,
  foreign key (entity_id, area_id, user_id) references public.impact_entities(id, area_id, user_id)
);
create index section_impact_entities_entity_idx on public.section_impact_entities(user_id, entity_id, section_impact_area_id);

create function public.seed_journal_emotions(p_user_id uuid) returns void language plpgsql security invoker as $$
declare level integer; item record;
begin
  if p_user_id is distinct from auth.uid() then raise exception 'Cannot seed another user''s emotions.'; end if;
  for level in 1..3 loop
    for item in
      with recursive catalog_tree as (
        select code,parent_code,name,color,position,1 as depth from public.journal_emotion_catalog where parent_code is null
        union all
        select c.code,c.parent_code,c.name,c.color,c.position,t.depth+1 from public.journal_emotion_catalog c join catalog_tree t on c.parent_code=t.code
      ) select * from catalog_tree where depth=level order by position,code
    loop
      insert into public.journal_emotions(user_id,catalog_code,parent_id,name,color,is_system,position)
      values (p_user_id,item.code,(select id from public.journal_emotions where user_id=p_user_id and catalog_code=item.parent_code and archived_at is null and deleted_at is null order by created_at desc limit 1),item.name,item.color,true,item.position);
    end loop;
  end loop;
end; $$;
create function public.ensure_journal_emotions() returns void language plpgsql security invoker as $$
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  insert into public.journal_emotion_library_state(user_id) values (auth.uid()) on conflict do nothing;
  if found then perform public.seed_journal_emotions(auth.uid()); end if;
end; $$;
create function public.reset_journal_emotions() returns void language plpgsql security invoker as $$
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  insert into public.journal_emotion_library_state(user_id) values (auth.uid()) on conflict do nothing;
  update public.journal_emotions set archived_at=now(),updated_at=now()
    where user_id=auth.uid() and archived_at is null and deleted_at is null;
  perform public.seed_journal_emotions(auth.uid());
end; $$;

create function public.reorder_entry_sections(p_entry_id uuid, p_section_ids uuid[]) returns void language plpgsql security invoker as $$
declare actual_count integer;
begin
  if not exists (select 1 from public.entries where id=p_entry_id and user_id=auth.uid() and deleted_at is null) then raise exception 'Entry not found.'; end if;
  if p_section_ids is null then raise exception 'Section order is required.'; end if;
  select count(*) into actual_count from public.entry_sections where entry_id=p_entry_id and user_id=auth.uid() and deleted_at is null;
  if actual_count <> cardinality(p_section_ids) or actual_count <> (select count(distinct requested.id) from unnest(p_section_ids) as requested(id))
    or exists (select 1 from unnest(p_section_ids) as requested(id) where not exists (select 1 from public.entry_sections s where s.id=requested.id and s.entry_id=p_entry_id and s.user_id=auth.uid() and s.deleted_at is null))
  then raise exception 'Section order does not match this entry.'; end if;
  update public.entry_sections s set position=(ordered.ordinal - 1)::integer,updated_at=now()
    from unnest(p_section_ids) with ordinality as ordered(id,ordinal)
    where s.id=ordered.id and s.entry_id=p_entry_id and s.user_id=auth.uid();
end; $$;

alter table public.entry_sections enable row level security;
alter table public.journal_emotion_catalog enable row level security;
alter table public.journal_emotion_library_state enable row level security;
alter table public.journal_emotions enable row level security;
alter table public.section_emotions enable row level security;
alter table public.impact_areas enable row level security;
alter table public.impact_entities enable row level security;
alter table public.section_impact_areas enable row level security;
alter table public.section_impact_entities enable row level security;
create policy catalog_read on public.journal_emotion_catalog for select to authenticated using (true);
create policy owner_all on public.entry_sections for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy owner_all on public.journal_emotion_library_state for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy owner_all on public.journal_emotions for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy owner_all on public.section_emotions for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy owner_all on public.impact_areas for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy owner_all on public.impact_entities for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy owner_all on public.section_impact_areas for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy owner_all on public.section_impact_entities for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

grant select on public.journal_emotion_catalog to authenticated;
grant select,insert,update,delete on public.entry_sections,public.journal_emotion_library_state,public.journal_emotions,
  public.section_emotions,public.impact_areas,public.impact_entities,public.section_impact_areas,public.section_impact_entities to authenticated;
revoke execute on function public.seed_journal_emotions(uuid) from public;
revoke execute on function public.ensure_journal_emotions() from public;
revoke execute on function public.reset_journal_emotions() from public;
revoke execute on function public.reorder_entry_sections(uuid,uuid[]) from public;
grant execute on function public.ensure_journal_emotions() to authenticated;
grant execute on function public.seed_journal_emotions(uuid) to authenticated;
grant execute on function public.reset_journal_emotions() to authenticated;
grant execute on function public.reorder_entry_sections(uuid,uuid[]) to authenticated;
