import "server-only";
import { userDb } from "./db";

type Database = Awaited<ReturnType<typeof userDb>>["db"];
type ExportSection = { id: string; entry_id: string; title: string; content_text: string; position: number; emotion?: { emotion_name: string; intensity: number | null }; impacts: { area_name: string; entities: string[] }[] };

export async function sectionsForMarkdown(db: Database, userId: string, entryIds: string[]) {
  const result = new Map<string, ExportSection[]>();
  if (!entryIds.length) return result;
  const sections: ExportSection[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from("entry_sections").select("id,entry_id,title,content_text,position").eq("user_id", userId).in("entry_id", entryIds).is("deleted_at", null).order("entry_id").order("position").order("id").range(offset, offset + 499);
    if (error) throw error;
    sections.push(...(data || []).map(item => ({ ...item, impacts: [] })));
    if (!data || data.length < 500) break;
  }
  for (let start = 0; start < sections.length; start += 100) {
    const batch = sections.slice(start, start + 100); const ids = batch.map(item => item.id);
    const [emotions, impacts] = await Promise.all([
      db.from("section_emotions").select("section_id,emotion_name,intensity").eq("user_id", userId).in("section_id", ids),
      db.from("section_impact_areas").select("id,section_id,area_name").eq("user_id", userId).in("section_id", ids),
    ]);
    if (emotions.error || impacts.error) throw emotions.error || impacts.error;
    const areaRows = impacts.data || [];
    const entityRows = areaRows.length ? await db.from("section_impact_entities").select("section_impact_area_id,entity_name").eq("user_id", userId).in("section_impact_area_id", areaRows.map(item => item.id)) : { data: [], error: null };
    if (entityRows.error) throw entityRows.error;
    const emotionBySection = new Map((emotions.data || []).map(item => [item.section_id, item]));
    const entitiesByArea = new Map<string, string[]>();
    for (const entity of entityRows.data || []) entitiesByArea.set(entity.section_impact_area_id, [...(entitiesByArea.get(entity.section_impact_area_id) || []), entity.entity_name]);
    const areasBySection = new Map<string, ExportSection["impacts"]>();
    for (const area of areaRows) areasBySection.set(area.section_id, [...(areasBySection.get(area.section_id) || []), { area_name: area.area_name, entities: entitiesByArea.get(area.id) || [] }]);
    for (const section of batch) { section.emotion = emotionBySection.get(section.id); section.impacts = areasBySection.get(section.id) || []; }
  }
  for (const section of sections) result.set(section.entry_id, [...(result.get(section.entry_id) || []), section]);
  return result;
}
