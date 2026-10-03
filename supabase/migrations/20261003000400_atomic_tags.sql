create or replace function public.replace_entry_tags(p_entry_id uuid, p_names text[])
returns void language plpgsql security invoker as $$
declare n text;
begin
  if not exists (select 1 from public.entries where id = p_entry_id and user_id = auth.uid() and deleted_at is null) then
    raise exception 'ENTRY_NOT_FOUND' using errcode = 'P0001';
  end if;
  if cardinality(p_names) > 20 then raise exception 'TOO_MANY_TAGS'; end if;
  for n in select distinct trim(value) from unnest(p_names) as input(value) where length(trim(value)) > 0 loop
    if length(n) > 60 then raise exception 'TAG_TOO_LONG'; end if;
    insert into public.tags(user_id, name) values (auth.uid(), n)
    on conflict (user_id, normalized_name) do nothing;
  end loop;
  delete from public.entry_tags where entry_id = p_entry_id and user_id = auth.uid();
  insert into public.entry_tags(user_id, entry_id, tag_id)
  select auth.uid(), p_entry_id, t.id from public.tags t
  where t.user_id = auth.uid() and t.normalized_name in (
    select distinct lower(trim(value)) from unnest(p_names) as input(value) where length(trim(value)) > 0
  );
end; $$;
