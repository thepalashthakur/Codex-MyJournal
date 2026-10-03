import "server-only";
import { createHash } from "node:crypto";
import { userDb } from "./db";
import { createEntryInput, entryDraft, journalInput, tagName, uuid } from "./validation";
import { z } from "zod";
import { textFromContent } from "./content";

type UserDatabase = Awaited<ReturnType<typeof userDb>>["db"];

function defaultJournalId(userId: string) {
  const namespace = Buffer.from("e760e360a60c4b3e90a0ca7615456bb6", "hex");
  const bytes = createHash("sha1").update(namespace).update(userId).digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

async function ensureDefaultJournal(db: UserDatabase, userId: string) {
  const id = defaultJournalId(userId);
  const { data: existing, error: lookupError } = await db.from("journals").select("id,archived_at").eq("id", id).eq("user_id", userId).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) {
    if (existing.archived_at) {
      const { error } = await db.from("journals").update({ archived_at: null }).eq("id", id).eq("user_id", userId);
      if (error) throw error;
    }
    return id;
  }
  const { error } = await db.from("journals").insert({ id, user_id: userId, name: "My Journal", description: "Your entries, all in one place.", color: "#eb5e28", position: 0 });
  if (!error) return id;
  if (error.code === "23505") {
    const { data: concurrent, error: retryError } = await db.from("journals").select("id").eq("id", id).eq("user_id", userId).maybeSingle();
    if (retryError) throw retryError;
    if (concurrent) return id;
  }
  throw error;
}

export async function listJournals(includeArchived = false) {
  const { db, user } = await userDb();
  const defaultId = await ensureDefaultJournal(db, user.id);
  let query = db.from("journals").select("id,name,description,color,icon,position,archived_at,collection_id").eq("user_id", user.id).order("position").order("created_at");
  if (!includeArchived) query = query.is("archived_at", null);
  const { data, error } = await query;
  if (error) throw error;
  return data.map(journal => ({ ...journal, is_default: journal.id === defaultId })).sort((a, b) => Number(b.is_default) - Number(a.is_default));
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
  if (id === defaultJournalId(user.id)) throw new Error("The default journal cannot be deleted.");
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
  if (id === defaultJournalId(user.id) && (value.archived === true || value.position !== undefined)) throw new Error("The default journal cannot be archived or moved.");
  const row = { ...(value.name !== undefined && { name: value.name }), ...(value.description !== undefined && { description: value.description }), ...(value.color !== undefined && { color: value.color }), ...(value.collectionId !== undefined && { collection_id: value.collectionId }), ...(value.archived !== undefined && { archived_at: value.archived ? new Date().toISOString() : null }), ...(value.position !== undefined && { position: value.position }), updated_at: new Date().toISOString() };
  const { data, error } = await db.from("journals").update(row).eq("id", id).eq("user_id", user.id).select("id").single();
  if (error) throw error; return data;
}
export async function createEntry(input: unknown) {
  const value = createEntryInput.parse(input);
  const { db, user } = await userDb();
  const journalId = value.journalId ?? await ensureDefaultJournal(db, user.id);
  const { data: journal } = await db.from("journals").select("id").eq("id", journalId).eq("user_id", user.id).is("archived_at", null).maybeSingle();
  if (!journal) throw new Error("Journal not found.");
  const content = value.content || { type: "doc", content: [{ type: "paragraph" }] };
  const { data, error } = await db.from("entries").insert({ user_id: user.id, journal_id: journal.id, title: value.title, content, content_text: textFromContent(content), entry_date: value.entryDate, local_date: value.localDate, timezone: value.timezone }).select("id").single();
  if (error) throw error; return data;
}
export async function getEntry(id: string) {
  uuid.parse(id); const { db, user } = await userDb();
  const { data, error } = await db.from("entries").select("id,title,content,content_text,revision,entry_date,local_date,timezone,is_favorite,journal_id,deleted_at,weather_data,locations(id,place_name,latitude,longitude,source),journals(name,color),entry_tags(tags(id,name)),attachments(id,file_id,type,file_name,mime_type,size_bytes,caption)").eq("id", id).eq("user_id", user.id).maybeSingle();
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
  const selection = options.tagId ? "id,title,content_text,local_date,entry_date,is_favorite,journal_id,journals(name,color),entry_tags!inner(tag_id,tags(id,name)),attachments(id,type,file_name)" : "id,title,content_text,local_date,entry_date,is_favorite,journal_id,journals(name,color),entry_tags(tags(id,name)),attachments(id,type,file_name)";
  let query = db.from("entries").select(selection).eq("user_id", user.id).order("entry_date", { ascending: false }).order("id", { ascending: false }).limit(limit);
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
  const { db } = await userDb();
  const { error } = await db.rpc("replace_entry_tags", { p_entry_id: entryId, p_names: parsed });
  if (error) throw error;
}
