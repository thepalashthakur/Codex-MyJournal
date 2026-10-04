export type Emotion = {
  id: string; name: string; parent_id: string | null; color: string; position: number;
  is_system: boolean; is_hidden: boolean; archived_at: string | null; deleted_at: string | null;
};
export type ImpactArea = { id: string; name: string; color: string; position: number; archived_at: string | null };
export type ImpactEntity = { id: string; area_id: string; name: string; position: number; archived_at: string | null };
export type SectionEmotion = { emotion_id: string; emotion_name: string; emotion_color: string; intensity: number | null };
export type SectionImpactEntity = { id: string; entity_id: string; entity_name: string };
export type SectionImpactArea = { id: string; area_id: string; area_name: string; area_color: string; entities: SectionImpactEntity[] };
export type EntrySection = {
  id: string; entry_id: string; title: string; content: Record<string, unknown>; content_text: string;
  position: number; revision: number; emotion: SectionEmotion | null; impacts: SectionImpactArea[];
};
