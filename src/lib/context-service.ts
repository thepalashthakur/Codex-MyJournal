import "server-only";

import { userDb } from "./db";
import { textFromContent } from "./content";
import {
  id, emotionCreate, emotionPatch, impactAreaCreate, impactAreaPatch, impactEntityCreate,
  impactEntityPatch, sectionCreate, sectionPatch, sectionOrder, sectionContextAction,
} from "./context-validation";
import type { Emotion, EntrySection, ImpactArea, ImpactEntity, SectionEmotion, SectionImpactArea, SectionImpactEntity } from "./emotional-context";
import { validateEmotionPlacement } from "./emotion-hierarchy";

type Session = Awaited<ReturnType<typeof userDb>>;
const emptyContent = { type: "doc", content: [{ type: "paragraph" }] };

async function ownedEntry(session: Session, entryId: string) {
  const { data, error } = await session.db.from("entries").select("id").eq("id", id.parse(entryId)).eq("user_id", session.user.id).is("deleted_at", null).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Entry not found.");
}
async function ownedSection(session: Session, entryId: string, sectionId: string) {
  await ownedEntry(session, entryId);
  const { data, error } = await session.db.from("entry_sections").select("id,revision").eq("id", id.parse(sectionId)).eq("entry_id", entryId).eq("user_id", session.user.id).is("deleted_at", null).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Section not found.");
  return data;
}
function checked<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw error;
  if (data === null) throw new Error("Requested item not found.");
  return data;
}

export async function listEmotionLibrary() {
  const session = await userDb();
  const seeded = await session.db.rpc("ensure_journal_emotions");
  if (seeded.error) throw seeded.error;
  const { data, error } = await session.db.from("journal_emotions").select("id,name,parent_id,color,position,is_system,is_hidden,archived_at,deleted_at").eq("user_id", session.user.id).is("deleted_at", null).order("position").order("name");
  return checked(data, error) as Emotion[];
}
export async function emotionSuggestions() {
  const { db, user } = await userDb();
  const { data, error } = await db.from("section_emotions").select("emotion_id").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(100);
  if (error) throw error;
  const rows = data || [];
  const recentIds = [...new Set(rows.slice(0, 12).map(row => row.emotion_id))].slice(0, 5);
  const frequency = new Map<string, number>();
  for (const row of rows) frequency.set(row.emotion_id, (frequency.get(row.emotion_id) || 0) + 1);
  const frequentIds = [...frequency].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([emotionId]) => emotionId);
  return { recentIds, frequentIds };
}
export async function resetEmotionLibrary() {
  const { db } = await userDb();
  const { error } = await db.rpc("reset_journal_emotions");
  if (error) throw error;
}
export async function createEmotion(input: unknown) {
  const value = emotionCreate.parse(input);
  const { db, user } = await userDb();
  const { data: tree, error: treeError } = await db.from("journal_emotions").select("id,parent_id,archived_at").eq("user_id", user.id).is("deleted_at", null);
  if (treeError) throw treeError;
  validateEmotionPlacement(tree || [], null, value.parentId);
  const { data, error } = await db.from("journal_emotions").insert({ user_id: user.id, name: value.name, color: value.color, parent_id: value.parentId }).select("id,name,parent_id,color,position,is_system,is_hidden,archived_at,deleted_at").single();
  return checked(data, error) as Emotion;
}
export async function updateEmotion(emotionId: string, input: unknown) {
  const value = emotionPatch.parse(input);
  const { db, user } = await userDb();
  let parentChanged = false;
  if (value.parentId !== undefined) {
    const { data: tree, error: treeError } = await db.from("journal_emotions").select("id,parent_id,archived_at").eq("user_id", user.id).is("deleted_at", null);
    if (treeError) throw treeError;
    const current = tree?.find(node => node.id === emotionId);
    if (!current) throw new Error("Emotion not found.");
    parentChanged = current.parent_id !== value.parentId;
    if (parentChanged) validateEmotionPlacement(tree || [], emotionId, value.parentId);
  }
  const row = { ...(value.name !== undefined && { name: value.name }), ...(value.color !== undefined && { color: value.color }), ...(parentChanged && { parent_id: value.parentId }), ...(value.position !== undefined && { position: value.position }), ...(value.hidden !== undefined && { is_hidden: value.hidden }), ...(value.archived !== undefined && { archived_at: value.archived ? new Date().toISOString() : null }), updated_at: new Date().toISOString() };
  const { data, error } = await db.from("journal_emotions").update(row).eq("id", id.parse(emotionId)).eq("user_id", user.id).is("deleted_at", null).select("id,name,parent_id,color,position,is_system,is_hidden,archived_at,deleted_at").single();
  return checked(data, error) as Emotion;
}
export async function deleteEmotion(emotionId: string) {
  const { db, user } = await userDb();
  const target = id.parse(emotionId);
  const { data, error } = await db.from("journal_emotions").select("id,is_system").eq("id", target).eq("user_id", user.id).is("deleted_at", null).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Emotion not found.");
  if (data.is_system) throw new Error("Default emotions can be hidden or archived, but not deleted.");
  const [{ count: useCount, error: useError }, { count: childCount, error: childError }] = await Promise.all([
    db.from("section_emotions").select("section_id", { count: "exact", head: true }).eq("emotion_id", target).eq("user_id", user.id),
    db.from("journal_emotions").select("id", { count: "exact", head: true }).eq("parent_id", target).eq("user_id", user.id).is("deleted_at", null),
  ]);
  if (useError || childError) throw useError || childError;
  if (useCount || childCount) return updateEmotion(target, { archived: true });
  const result = await db.from("journal_emotions").delete().eq("id", target).eq("user_id", user.id);
  if (result.error) throw result.error;
  return { deleted: true };
}

export async function listImpactLibrary() {
  const { db, user } = await userDb();
  const [areas, entities] = await Promise.all([
    db.from("impact_areas").select("id,name,color,position,archived_at").eq("user_id", user.id).order("position").order("name"),
    db.from("impact_entities").select("id,area_id,name,position,archived_at").eq("user_id", user.id).order("position").order("name"),
  ]);
  return { areas: checked(areas.data, areas.error) as ImpactArea[], entities: checked(entities.data, entities.error) as ImpactEntity[] };
}
export async function createImpactArea(input: unknown) {
  const value = impactAreaCreate.parse(input);
  const { db, user } = await userDb();
  const { data, error } = await db.from("impact_areas").insert({ user_id: user.id, name: value.name, color: value.color }).select("id,name,color,position,archived_at").single();
  return checked(data, error) as ImpactArea;
}
export async function updateImpactArea(areaId: string, input: unknown) {
  const value = impactAreaPatch.parse(input);
  const { db, user } = await userDb();
  const row = { ...(value.name !== undefined && { name: value.name }), ...(value.color !== undefined && { color: value.color }), ...(value.position !== undefined && { position: value.position }), ...(value.archived !== undefined && { archived_at: value.archived ? new Date().toISOString() : null }), updated_at: new Date().toISOString() };
  const { data, error } = await db.from("impact_areas").update(row).eq("id", id.parse(areaId)).eq("user_id", user.id).select("id,name,color,position,archived_at").single();
  return checked(data, error) as ImpactArea;
}
export async function deleteImpactArea(areaId: string) {
  const { db, user } = await userDb(); const target = id.parse(areaId);
  const [{ count: entities, error: entityError }, { count: uses, error: useError }] = await Promise.all([
    db.from("impact_entities").select("id", { count: "exact", head: true }).eq("area_id", target).eq("user_id", user.id),
    db.from("section_impact_areas").select("id", { count: "exact", head: true }).eq("area_id", target).eq("user_id", user.id),
  ]);
  if (entityError || useError) throw entityError || useError;
  if (entities || uses) return updateImpactArea(target, { archived: true });
  const { error } = await db.from("impact_areas").delete().eq("id", target).eq("user_id", user.id);
  if (error) throw error; return { deleted: true };
}
export async function createImpactEntity(input: unknown) {
  const value = impactEntityCreate.parse(input);
  const { db, user } = await userDb();
  const { data: area, error: areaError } = await db.from("impact_areas").select("id").eq("id", value.areaId).eq("user_id", user.id).is("archived_at", null).maybeSingle();
  if (areaError) throw areaError;
  if (!area) throw new Error("Impact area not found.");
  const { data, error } = await db.from("impact_entities").insert({ user_id: user.id, area_id: value.areaId, name: value.name }).select("id,area_id,name,position,archived_at").single();
  return checked(data, error) as ImpactEntity;
}
export async function updateImpactEntity(entityId: string, input: unknown) {
  const value = impactEntityPatch.parse(input);
  const { db, user } = await userDb();
  let areaChanged = false;
  if (value.areaId !== undefined) {
    const { data: current, error: currentError } = await db.from("impact_entities").select("area_id").eq("id", id.parse(entityId)).eq("user_id", user.id).maybeSingle();
    if (currentError) throw currentError;
    if (!current) throw new Error("Impact entity not found.");
    areaChanged = current.area_id !== value.areaId;
  }
  if (areaChanged && value.areaId) {
    const { data, error } = await db.from("impact_areas").select("id").eq("id", value.areaId).eq("user_id", user.id).is("archived_at", null).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Impact area not found.");
    const { count, error: useError } = await db.from("section_impact_entities").select("id", { count: "exact", head: true }).eq("entity_id", entityId).eq("user_id", user.id);
    if (useError) throw useError;
    if (count) throw new Error("An entity already used in entries cannot be moved. Archive it and create a new one in the other area.");
  }
  const row = { ...(value.name !== undefined && { name: value.name }), ...(areaChanged && { area_id: value.areaId }), ...(value.position !== undefined && { position: value.position }), ...(value.archived !== undefined && { archived_at: value.archived ? new Date().toISOString() : null }), updated_at: new Date().toISOString() };
  const { data, error } = await db.from("impact_entities").update(row).eq("id", id.parse(entityId)).eq("user_id", user.id).select("id,area_id,name,position,archived_at").single();
  return checked(data, error) as ImpactEntity;
}
export async function deleteImpactEntity(entityId: string) {
  const { db, user } = await userDb(); const target = id.parse(entityId);
  const { count, error } = await db.from("section_impact_entities").select("id", { count: "exact", head: true }).eq("entity_id", target).eq("user_id", user.id);
  if (error) throw error;
  if (count) return updateImpactEntity(target, { archived: true });
  const result = await db.from("impact_entities").delete().eq("id", target).eq("user_id", user.id);
  if (result.error) throw result.error; return { deleted: true };
}

export async function listEntrySections(entryId: string, sectionId?: string): Promise<EntrySection[]> {
  const session = await userDb(); await ownedEntry(session, entryId);
  const { db, user } = session;
  let query = db.from("entry_sections").select("id,entry_id,title,content,content_text,position,revision").eq("entry_id", entryId).eq("user_id", user.id).is("deleted_at", null);
  if (sectionId) query = query.eq("id", id.parse(sectionId));
  const { data: sections, error } = await query.order("position").order("created_at").limit(sectionId ? 1 : 100);
  if (error) throw error;
  if (!sections?.length) return [];
  const ids = sections.map(section => section.id);
  const [emotionResult, areaResult] = await Promise.all([
    db.from("section_emotions").select("section_id,emotion_id,emotion_name,emotion_color,intensity").eq("user_id", user.id).in("section_id", ids),
    db.from("section_impact_areas").select("id,section_id,area_id,area_name,area_color").eq("user_id", user.id).in("section_id", ids),
  ]);
  if (emotionResult.error || areaResult.error) throw emotionResult.error || areaResult.error;
  const impacts = areaResult.data || [];
  const entityResult = impacts.length ? await db.from("section_impact_entities").select("id,section_impact_area_id,entity_id,entity_name").eq("user_id", user.id).in("section_impact_area_id", impacts.map(area => area.id)) : { data: [], error: null };
  if (entityResult.error) throw entityResult.error;
  const emotions = new Map((emotionResult.data || []).map(item => [item.section_id, item as SectionEmotion & { section_id: string }]));
  const entities = new Map<string, SectionImpactEntity[]>();
  for (const item of entityResult.data || []) entities.set(item.section_impact_area_id, [...(entities.get(item.section_impact_area_id) || []), { id: item.id, entity_id: item.entity_id, entity_name: item.entity_name }]);
  const impactMap = new Map<string, SectionImpactArea[]>();
  for (const area of impacts) impactMap.set(area.section_id, [...(impactMap.get(area.section_id) || []), { id: area.id, area_id: area.area_id, area_name: area.area_name, area_color: area.area_color, entities: entities.get(area.id) || [] }]);
  return sections.map(section => ({ ...section, content: section.content as Record<string, unknown>, emotion: emotions.get(section.id) || null, impacts: impactMap.get(section.id) || [] }));
}
export async function createEntrySection(entryId: string, input: unknown) {
  const value = sectionCreate.parse(input); const session = await userDb(); await ownedEntry(session, entryId);
  const { db, user } = session;
  const { count, error: countError } = await db.from("entry_sections").select("id", { count: "exact", head: true }).eq("entry_id", entryId).eq("user_id", user.id).is("deleted_at", null);
  if (countError) throw countError;
  if ((count || 0) >= 100) throw new Error("An entry can have at most 100 sections.");
  let content: Record<string, unknown> = emptyContent; let contentText = ""; let title = value.title;
  if (value.duplicateFrom) {
    const { data, error } = await db.from("entry_sections").select("title,content,content_text").eq("id", value.duplicateFrom).eq("entry_id", entryId).eq("user_id", user.id).is("deleted_at", null).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Section to duplicate not found.");
    content = data.content as Record<string, unknown>; contentText = data.content_text; title = data.title;
  }
  const { data, error } = await db.from("entry_sections").insert({ user_id: user.id, entry_id: entryId, title, content, content_text: contentText, position: count || 0 }).select("id").single();
  return checked(data, error);
}
export async function updateEntrySection(entryId: string, sectionId: string, input: unknown) {
  const value = sectionPatch.parse(input); const session = await userDb(); await ownedSection(session, entryId, sectionId);
  const { db, user } = session;
  const { data, error } = await db.from("entry_sections").update({ title: value.title, content: value.content, content_text: textFromContent(value.content), revision: value.revision + 1, updated_at: new Date().toISOString() }).eq("id", sectionId).eq("entry_id", entryId).eq("user_id", user.id).eq("revision", value.revision).is("deleted_at", null).select("revision").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("SECTION_VERSION_CONFLICT");
  return data;
}
export async function deleteEntrySection(entryId: string, sectionId: string) {
  const session = await userDb(); await ownedSection(session, entryId, sectionId);
  const { count, error: countError } = await session.db.from("entry_sections").select("id", { count: "exact", head: true }).eq("entry_id", entryId).eq("user_id", session.user.id).is("deleted_at", null);
  if (countError) throw countError;
  if ((count || 0) <= 1) throw new Error("Keep at least one writing section.");
  const { error } = await session.db.from("entry_sections").update({ deleted_at: new Date().toISOString() }).eq("id", sectionId).eq("entry_id", entryId).eq("user_id", session.user.id);
  if (error) throw error;
}
export async function reorderEntrySections(entryId: string, input: unknown) {
  const value = sectionOrder.parse(input);
  const { db } = await userDb();
  const { error } = await db.rpc("reorder_entry_sections", { p_entry_id: id.parse(entryId), p_section_ids: value.ids });
  if (error) throw error;
}
export async function changeSectionContext(entryId: string, sectionId: string, input: unknown) {
  const value = sectionContextAction.parse(input); const session = await userDb(); await ownedSection(session, entryId, sectionId);
  const { db, user } = session;
  if (value.action === "setEmotion") {
    if (value.emotionId === null) {
      const { error } = await db.from("section_emotions").delete().eq("section_id", sectionId).eq("user_id", user.id);
      if (error) throw error;
    } else {
      const { data: emotion, error } = await db.from("journal_emotions").select("id,name,color").eq("id", value.emotionId).eq("user_id", user.id).is("archived_at", null).is("deleted_at", null).maybeSingle();
      if (error) throw error;
      if (!emotion) throw new Error("Emotion not available.");
      const result = await db.from("section_emotions").upsert({ section_id: sectionId, user_id: user.id, emotion_id: emotion.id, emotion_name: emotion.name, emotion_color: emotion.color, intensity: value.intensity, updated_at: new Date().toISOString() }, { onConflict: "section_id" });
      if (result.error) throw result.error;
    }
  } else if (value.action === "addArea") {
    const { data: area, error } = await db.from("impact_areas").select("id,name,color").eq("id", value.areaId).eq("user_id", user.id).is("archived_at", null).maybeSingle();
    if (error) throw error;
    if (!area) throw new Error("Impact area not available.");
    const result = await db.from("section_impact_areas").upsert({ user_id: user.id, section_id: sectionId, area_id: area.id, area_name: area.name, area_color: area.color }, { onConflict: "section_id,area_id", ignoreDuplicates: true });
    if (result.error) throw result.error;
  } else if (value.action === "removeArea") {
    const { error } = await db.from("section_impact_areas").delete().eq("section_id", sectionId).eq("area_id", value.areaId).eq("user_id", user.id);
    if (error) throw error;
  } else if (value.action === "addEntity") {
    const { data: entity, error } = await db.from("impact_entities").select("id,name").eq("id", value.entityId).eq("area_id", value.areaId).eq("user_id", user.id).is("archived_at", null).maybeSingle();
    if (error) throw error;
    if (!entity) throw new Error("Impact entity not available.");
    const { data: area, error: areaError } = await db.from("section_impact_areas").select("id").eq("section_id", sectionId).eq("area_id", value.areaId).eq("user_id", user.id).maybeSingle();
    if (areaError) throw areaError;
    if (!area) throw new Error("Select the impact area first.");
    const result = await db.from("section_impact_entities").upsert({ user_id: user.id, section_impact_area_id: area.id, area_id: value.areaId, entity_id: entity.id, entity_name: entity.name }, { onConflict: "section_impact_area_id,entity_id", ignoreDuplicates: true });
    if (result.error) throw result.error;
  } else {
    const { data: area, error: areaError } = await db.from("section_impact_areas").select("id").eq("section_id", sectionId).eq("area_id", value.areaId).eq("user_id", user.id).maybeSingle();
    if (areaError) throw areaError;
    if (!area) throw new Error("Impact area not selected.");
    const { error } = await db.from("section_impact_entities").delete().eq("section_impact_area_id", area.id).eq("entity_id", value.entityId).eq("user_id", user.id);
    if (error) throw error;
  }
  return { ok: true };
}
