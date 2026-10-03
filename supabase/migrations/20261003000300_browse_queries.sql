create or replace function public.calendar_day_counts(p_start date, p_end date)
returns table(local_date date, entry_count bigint)
language sql stable security invoker as $$
  select e.local_date, count(*) from public.entries e
  where e.user_id = auth.uid() and e.deleted_at is null
    and e.local_date >= p_start and e.local_date < p_end
  group by e.local_date order by e.local_date;
$$;

create or replace function public.on_this_day(p_month integer, p_day integer, p_year integer, p_journal uuid default null)
returns setof public.entries language sql stable security invoker as $$
  select e.* from public.entries e
  where e.user_id = auth.uid() and e.deleted_at is null
    and extract(month from e.local_date) = p_month
    and extract(day from e.local_date) = p_day
    and extract(year from e.local_date) < p_year
    and (p_journal is null or e.journal_id = p_journal)
  order by e.local_date desc, e.entry_date desc limit 50;
$$;

create or replace function public.search_journal(
  p_query text, p_journal uuid default null, p_favorites boolean default false,
  p_tags uuid[] default '{}', p_from date default null, p_to date default null,
  p_media_type text default null
) returns setof public.entries language sql stable security invoker as $$
  select e.* from public.entries e
  join public.journals j on j.id = e.journal_id and j.user_id = e.user_id
  left join public.locations l on l.id = e.location_id and l.user_id = e.user_id
  where e.user_id = auth.uid() and e.deleted_at is null
    and (p_query = '' or to_tsvector('simple', coalesce(e.title,'') || ' ' || e.content_text || ' ' || j.name || ' ' || coalesce(l.place_name,'') || ' ' || coalesce(l.locality,'') || ' ' || coalesce((select string_agg(t.name, ' ') from public.entry_tags et join public.tags t on t.id=et.tag_id where et.entry_id=e.id),'')) @@ websearch_to_tsquery('simple', p_query))
    and (p_journal is null or e.journal_id = p_journal)
    and (not p_favorites or e.is_favorite)
    and (p_from is null or e.local_date >= p_from)
    and (p_to is null or e.local_date <= p_to)
    and (p_media_type is null or exists (select 1 from public.attachments a where a.entry_id=e.id and a.type=p_media_type))
    and (cardinality(p_tags)=0 or (select count(distinct et.tag_id) from public.entry_tags et where et.entry_id=e.id and et.tag_id=any(p_tags))=cardinality(p_tags))
  order by e.entry_date desc, e.id desc limit 50;
$$;
