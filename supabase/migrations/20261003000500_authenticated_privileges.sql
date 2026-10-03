-- RLS policies filter rows only after the database role has table privileges.
grant usage on schema public to authenticated;

grant select, insert, update, delete on table
  public.journal_collections,
  public.journals,
  public.locations,
  public.entries,
  public.tags,
  public.entry_tags,
  public.attachments,
  public.entry_templates,
  public.prompts,
  public.journal_reminders,
  public.attachment_cleanup
to authenticated;

-- S3Sync's own RLS policies permit these operations for an owned file.
grant select, insert, delete on table public.files to authenticated;

revoke execute on function public.save_entry(uuid, integer, text, jsonb, text, timestamptz, date, text, uuid, boolean) from public;
revoke execute on function public.calendar_day_counts(date, date) from public;
revoke execute on function public.on_this_day(integer, integer, integer, uuid) from public;
revoke execute on function public.search_journal(text, uuid, boolean, uuid[], date, date, text) from public;
revoke execute on function public.replace_entry_tags(uuid, text[]) from public;

grant execute on function public.save_entry(uuid, integer, text, jsonb, text, timestamptz, date, text, uuid, boolean) to authenticated;
grant execute on function public.calendar_day_counts(date, date) to authenticated;
grant execute on function public.on_this_day(integer, integer, integer, uuid) to authenticated;
grant execute on function public.search_journal(text, uuid, boolean, uuid[], date, date, text) to authenticated;
grant execute on function public.replace_entry_tags(uuid, text[]) to authenticated;
