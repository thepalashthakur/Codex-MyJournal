import "server-only";
import { userDb } from "./db";
import { createEntryInput, entryDraft, journalInput, tagName, uuid } from "./validation";
import { z } from "zod";
import { textFromContent } from "./content";

export async function listJournals(includeArchived = false) {
  const { db, user } = await userDb();
  let query = db.from("journals").select("id,name,description,color,icon,position,archived_at,collection_id").eq("user_id", user.id).order("position").order("created_at");
  if (!includeArchived) query = query.is("archived_at", null);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
export async function createJournal(input: unknown) {
  const value = journalInput.parse(input);
  const { db, user } = await userDb();
  const { data: last } = await db.from("journals").select("position").eq("user_id", user.id).order("position", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await db.from("journals").insert({ user_id: user.id, name: value.name, description: value.description || null, color: value.color, collection_id: value.collectionId || null, position: (last?.position || 0) + 1 }).select("id").single();
  if (error) throw error; return data;
}
export async function deleteJournal(id: string) {
  uuid.parse(id); const { db, user } = await userDb();
  const { count, error: countError } = await db.from("entries").select("id", { count: "exact", head: true }).eq("journal_id", id).eq("user_id", user.id);
  if (countError) throw countError;
  if (count) throw new Error("Move or delete entries before deleting this journal.");
  const { error } = await db.from("journals").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
}
export async function updateJournal(id: string, patch: unknown) {
  uuid.parse(id);
  const value = journalInput.partial().extend({ archived: z.boolean().optional(), position: z.number().int().optional() }).parse(patch);
  const { db, user } = await userDb();
  const row = { ...(value.name !== undefined && { name: value.name }), ...(value.description !== undefined && { description: value.description }), ...(value.color !== undefined && { color: value.color }), ...(value.collectionId !== undefined && { collection_id: value.collectionId }), ...(value.archived !== undefined && { archived_at: value.archived ? new Date().toISOString() : null }), ...(value.position !== undefined && { position: value.position }), updated_at: new Date().toISOString() };
  const { data, error } = await db.from("journals").update(row).eq("id", id).eq("user_id", user.id).select("id").single();
  if (error) throw error; return data;
}
export async function createEntry(input: unknown) {
  const value = createEntryInput.parse(input);
  const { db, user } = await userDb();
  const { data: journal } = await db.from("journals").select("id").eq("id", value.journalId).eq("user_id", user.id).is("archived_at", null).maybeSingle();
  if (!journal) throw new Error("Journal not found.");
  const content = value.content || { type: "doc", content: [{ type: "paragraph" }] };
  const { data, error } = await db.from("entries").insert({ user_id: user.id, journal_id: journal.id, title: value.title, content, content_text: textFromContent(content), entry_date: value.entryDate, local_date: value.localDate, timezone: value.timezone }).select("id").single();
  if (error) throw error; return data;
}
export async function getEntry(id: string) {
  uuid.parse(id); const { db, user } = await userDb();
  const { data, error } = await db.from("entries").select("id,title,content,content_text,revision,entry_date,local_date,timezone,is_favorite,journal_id,deleted_at,weather_data,locations(id,place_name,latitude,longitude),journals(name,color),entry_tags(tags(id,name)),attachments(id,file_id,type,file_name,mime_type,size_bytes,caption)").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error) throw error; return data;
}
export async function saveEntry(input: unknown) {
  const value = entryDraft.parse(input);
  const { db, user } = await userDb();
  const { data: journal } = await db.from("journals").select("id").eq("id", value.journalId).eq("user_id", user.id).is("archived_at", null).maybeSingle();
  if (!journal) throw new Error("Journal not found.");
  const { data, error } = await db.rpc("save_entry", { p_entry_id: value.id, p_expected_revision: value.revision, p_title: value.title, p_content: value.content, p_content_text: value.contentText, p_entry_date: value.entryDate, p_local_date: value.localDate, p_timezone: value.timezone, p_journal_id: value.journalId, p_is_favorite: value.isFavorite });
  if (error) throw error;
  return { revision: data.revision, updatedAt: data.updated_at };
}
export async function setEntryDeleted(id: string, deleted: boolean) {
  uuid.parse(id); const { db, user } = await userDb();
  const { error } = await db.from("entries").update({ deleted_at: deleted ? new Date().toISOString() : null }).eq("id", id).eq("user_id", user.id);
  if (error) throw error;
}
export async function listEntries(options: { journalId?: string; tagId?: string; favorites?: boolean; before?: string; search?: string; limit?: number; deleted?: boolean } = {}) {
  const { db, user } = await userDb(); const limit = Math.min(Math.max(options.limit || 20, 1), 50);
  let query = db.from("entries").select("id,title,content_text,local_date,entry_date,is_favorite,journal_id,journals(name,color),entry_tags(tags(id,name)),attachments(id,type,file_name)").eq("user_id", user.id).order("entry_date", { ascending: false }).order("id", { ascending: false }).limit(limit);
  query = options.deleted ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
  if (options.journalId) query = query.eq("journal_id", uuid.parse(options.journalId));
  if (options.favorites) query = query.eq("is_favorite", true);
  if (options.before) query = query.lt("entry_date", z.iso.datetime({ offset: true }).parse(options.before));
  if (options.search) query = query.textSearch("content_text", options.search, { type: "websearch", config: "simple" });
  if (options.tagId) query = query.eq("entry_tags.tag_id", uuid.parse(options.tagId));
  const { data, error } = await query; if (error) throw error; return data;
}
export async function entriesForDate(date: string, journalId?: string) {
  z.iso.date().parse(date); const { db, user } = await userDb();
  let query = db.from("entries").select("id,title,content_text,local_date,entry_date,is_favorite,journal_id,journals(name,color),entry_tags(tags(id,name)),attachments(id,type,file_name)").eq("user_id", user.id).eq("local_date", date).is("deleted_at", null).order("entry_date", { ascending: false }).limit(50);
  if (journalId) query = query.eq("journal_id", uuid.parse(journalId));
  const { data, error } = await query; if (error) throw error; return data;
}
export async function listTags() {
  const { db, user } = await userDb(); const { data, error } = await db.from("tags").select("id,name").eq("user_id", user.id).order("name");
  if (error) throw error; return data;
}
export async function setEntryTags(entryId: string, names: unknown) {
  uuid.parse(entryId); const parsed = z.array(tagName).max(20).parse(names);
  const { db, user } = await userDb();
  const { data: entry } = await db.from("entries").select("id").eq("id", entryId).eq("user_id", user.id).is("deleted_at", null).maybeSingle();
  if (!entry) throw new Error("Entry not found.");
  const unique = [...new Map(parsed.map(name => [name.toLowerCase(), name])).values()];
  const ids: string[] = [];
  for (const name of unique) {
    const { data, error } = await db.from("tags").upsert({ user_id: user.id, name }, { onConflict: "user_id,normalized_name", ignoreDuplicates: true }).select("id").maybeSingle();
    if (error) throw error;
    if (data) ids.push(data.id);
    else { const { data: existing } = await db.from("tags").select("id").eq("user_id", user.id).eq("normalized_name", name.toLowerCase()).single(); if (existing) ids.push(existing.id); }
  }
  const { error: deleteError } = await db.from("entry_tags").delete().eq("entry_id", entryId).eq("user_id", user.id);
  if (deleteError) throw deleteError;
  if (ids.length) { const { error } = await db.from("entry_tags").insert(ids.map(tag_id => ({ entry_id: entryId, tag_id, user_id: user.id }))); if (error) throw error; }
}
