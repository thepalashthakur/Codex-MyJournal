-- The entry body was the writing surface before sections were introduced.
-- Move that writing into an initial section without changing its TipTap JSON.
do $$
declare
  entry_row record;
  empty_document constant jsonb := '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb;
begin
  for entry_row in
    select e.id, e.user_id, e.content, e.content_text
    from public.entries e
    where coalesce(e.content_text, '') <> ''
       or e.content <> empty_document
       or not exists (
         select 1 from public.entry_sections s
         where s.entry_id = e.id and s.user_id = e.user_id and s.deleted_at is null
       )
    order by e.created_at, e.id
  loop
    update public.entry_sections
       set position = position + 1
     where entry_id = entry_row.id and user_id = entry_row.user_id and deleted_at is null;

    insert into public.entry_sections (user_id, entry_id, title, content, content_text, position)
    values (entry_row.user_id, entry_row.id, '', entry_row.content, entry_row.content_text, 0);

    update public.entries
       set content = empty_document, content_text = ''
     where id = entry_row.id and user_id = entry_row.user_id;
  end loop;
end $$;

-- A new entry and its first section must either both be saved or neither be saved.
create function public.create_entry_with_section(
  p_journal_id uuid,
  p_title text,
  p_section_content jsonb,
  p_section_text text,
  p_entry_date timestamptz,
  p_local_date date,
  p_timezone text
) returns uuid language plpgsql security invoker as $$
declare
  new_entry_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  insert into public.entries (user_id, journal_id, title, content, content_text, entry_date, local_date, timezone)
  values (auth.uid(), p_journal_id, p_title,
          '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb, '',
          p_entry_date, p_local_date, p_timezone)
  returning id into new_entry_id;

  insert into public.entry_sections (user_id, entry_id, title, content, content_text, position)
  values (auth.uid(), new_entry_id, '', p_section_content, p_section_text, 0);

  return new_entry_id;
end $$;
revoke execute on function public.create_entry_with_section(uuid,text,jsonb,text,timestamptz,date,text) from public;
grant execute on function public.create_entry_with_section(uuid,text,jsonb,text,timestamptz,date,text) to authenticated;
