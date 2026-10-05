import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ session: null as unknown }));
vi.mock("server-only", () => ({}));
vi.mock("../src/lib/db", () => ({ userDb: async () => state.session }));

import { changeSectionContext, createEmotion, createEntrySection, createImpactEntity, deleteEmotion, deleteEntrySection, reorderEntrySections, updateEntrySection, updateImpactEntity } from "../src/lib/context-service";

type Row = Record<string, unknown>;
type Result = { data: Row | Row[] | null; error: { message: string } | null; count?: number };
const userA = "00000000-0000-4000-8000-000000000001";
const userB = "00000000-0000-4000-8000-000000000002";
const entryA = "00000000-0000-4000-8000-000000000011";
const entryB = "00000000-0000-4000-8000-000000000012";
const sectionA = "00000000-0000-4000-8000-000000000021";
const sectionB = "00000000-0000-4000-8000-000000000022";
const emotionA = "00000000-0000-4000-8000-000000000031";
const emotionB = "00000000-0000-4000-8000-000000000032";
const areaA = "00000000-0000-4000-8000-000000000041";
const areaB = "00000000-0000-4000-8000-000000000042";
const entityB = "00000000-0000-4000-8000-000000000052";

class FakeQuery {
  private filters: ((row: Row) => boolean)[] = [];
  private operation: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private values: Row = {};
  private countRequested = false;
  private conflictKeys: string[] = [];
  constructor(private tables: Record<string, Row[]>, private table: string) {}
  select(_columns: string, options?: { count?: string; head?: boolean }) { this.countRequested = Boolean(options?.count && options?.head); return this; }
  eq(key: string, value: unknown) { this.filters.push(row => row[key] === value); return this; }
  is(key: string, value: null) { this.filters.push(row => row[key] === value); return this; }
  in(key: string, values: unknown[]) { this.filters.push(row => values.includes(row[key])); return this; }
  order() { return this; }
  limit() { return this; }
  insert(value: Row) { this.operation = "insert"; this.values = value; return this; }
  update(value: Row) { this.operation = "update"; this.values = value; return this; }
  delete() { this.operation = "delete"; return this; }
  upsert(value: Row, options?: { onConflict?: string }) { this.operation = "upsert"; this.values = value; this.conflictKeys = options?.onConflict?.split(",") || []; return this; }
  async maybeSingle() { return this.execute(true); }
  async single() { const result = this.execute(true); return result.data ? result : { ...result, error: { message: "Row not found" } }; }
  then(resolve: (result: Result) => unknown) { return Promise.resolve(this.execute()).then(resolve); }
  private execute(single = false): Result {
    const rows = this.tables[this.table] || (this.tables[this.table] = []);
    let matches = rows.filter(row => this.filters.every(test => test(row)));
    if (this.countRequested) return { data: null, count: matches.length, error: null };
    if (this.operation === "insert" || this.operation === "upsert") { let row = this.operation === "upsert" ? rows.find(item => this.conflictKeys.every(key => item[key] === this.values[key])) : undefined; if (row) Object.assign(row, this.values); else { row = { id: `00000000-0000-4000-8000-${String(rows.length + 100).padStart(12, "0")}`, ...(this.table === "entry_sections" ? { revision: 1, deleted_at: null } : {}), ...this.values }; rows.push(row); } matches = [row]; }
    if (this.operation === "update") { matches.forEach(row => Object.assign(row, this.values)); }
    if (this.operation === "delete") { for (const row of matches) rows.splice(rows.indexOf(row), 1); }
    return { data: single ? matches[0] || null : matches, error: null };
  }
}

let tables: Record<string, Row[]>;
const rpc = vi.fn(async () => ({ error: null }));
beforeEach(() => {
  rpc.mockClear();
  tables = {
    entries: [{ id: entryA, user_id: userA, deleted_at: null }, { id: entryB, user_id: userB, deleted_at: null }],
    entry_sections: [{ id: sectionA, entry_id: entryA, user_id: userA, revision: 2, deleted_at: null }, { id: sectionB, entry_id: entryB, user_id: userB, revision: 1, deleted_at: null }],
    journal_emotions: [{ id: emotionA, user_id: userA, name: "Hopeful", color: "#123456", parent_id: null, archived_at: null, deleted_at: null, is_system: false }, { id: emotionB, user_id: userB, name: "Calm", color: "#123456", parent_id: null, archived_at: null, deleted_at: null, is_system: false }],
    section_emotions: [],
    impact_areas: [{ id: areaA, user_id: userA, name: "Work", color: "#123456", archived_at: null }, { id: areaB, user_id: userB, name: "People", color: "#123456", archived_at: null }],
    impact_entities: [{ id: entityB, user_id: userB, area_id: areaB, name: "Other person", archived_at: null }],
    section_impact_areas: [], section_impact_entities: [],
  };
  state.session = { user: { id: userA }, db: { from: (table: string) => new FakeQuery(tables, table), rpc } };
});

describe("owner-scoped context services", () => {
  it("refuses to create or change sections on another user's entry", async () => {
    await expect(createEntrySection(entryB, {})).rejects.toThrow("Entry not found");
    await expect(deleteEntrySection(entryB, sectionB)).rejects.toThrow("Entry not found");
  });
  it("refuses another user's emotion as a parent or section selection", async () => {
    await expect(createEmotion({ name: "Child", parentId: emotionB })).rejects.toThrow("Parent emotion not available");
    await expect(changeSectionContext(entryA, sectionA, { action: "setEmotion", emotionId: emotionB })).rejects.toThrow("Emotion not available");
  });
  it("refuses another user's impact area and entity", async () => {
    await expect(createImpactEntity({ name: "Project", areaId: areaB })).rejects.toThrow("Impact area not found");
    await expect(changeSectionContext(entryA, sectionA, { action: "addArea", areaId: areaB })).rejects.toThrow("Impact area not available");
    await expect(changeSectionContext(entryA, sectionA, { action: "addEntity", areaId: areaA, entityId: entityB })).rejects.toThrow("Impact entity not available");
  });
  it("rejects stale section writes and preserves the newer revision", async () => {
    await expect(updateEntrySection(entryA, sectionA, { revision: 1, title: "Old", content: { type: "doc" }, contentText: "Old" })).rejects.toThrow("SECTION_VERSION_CONFLICT");
    expect(tables.entry_sections[0].revision).toBe(2);
  });
  it("archives a used custom emotion and retains its section association", async () => {
    tables.section_emotions.push({ section_id: sectionA, user_id: userA, emotion_id: emotionA, emotion_name: "Hopeful", intensity: 7 });
    await deleteEmotion(emotionA);
    expect(tables.journal_emotions[0].archived_at).toBeTruthy();
    expect(tables.section_emotions[0].emotion_name).toBe("Hopeful");
  });
  it("creates, updates, reorders, and soft-deletes an owned section", async () => {
    const created = await createEntrySection(entryA, { title: "Morning" });
    const createdId = created.id as string;
    expect(tables.entry_sections.find(row => row.id === createdId)?.position).toBe(1);
    const saved = await updateEntrySection(entryA, createdId, { revision: 1, title: "Morning notes", content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Calm" }] }] }, contentText: "Calm" });
    expect(saved.revision).toBe(2);
    expect(tables.entry_sections.find(row => row.id === createdId)?.content_text).toBe("Calm");
    await reorderEntrySections(entryA, { ids: [createdId, sectionA] });
    expect(rpc).toHaveBeenCalledWith("reorder_entry_sections", { p_entry_id: entryA, p_section_ids: [createdId, sectionA] });
    await deleteEntrySection(entryA, createdId);
    expect(tables.entry_sections.find(row => row.id === createdId)?.deleted_at).toBeTruthy();
    await expect(deleteEntrySection(entryA, sectionA)).rejects.toThrow("Keep at least one writing section");
  });
  it("keeps one emotion per section while allowing replacement, intensity, and removal", async () => {
    await changeSectionContext(entryA, sectionA, { action: "setEmotion", emotionId: emotionA, intensity: 7 });
    expect(tables.section_emotions).toHaveLength(1);
    expect(tables.section_emotions[0].intensity).toBe(7);
    await changeSectionContext(entryA, sectionA, { action: "setEmotion", emotionId: emotionA, intensity: 3 });
    expect(tables.section_emotions).toHaveLength(1);
    expect(tables.section_emotions[0].intensity).toBe(3);
    await changeSectionContext(entryA, sectionA, { action: "setEmotion", emotionId: null });
    expect(tables.section_emotions).toHaveLength(0);
  });
  it("adds and removes impact areas and multiple entities within an owned area", async () => {
    const entityOne = "00000000-0000-4000-8000-000000000053";
    const entityTwo = "00000000-0000-4000-8000-000000000054";
    tables.impact_entities.push({ id: entityOne, user_id: userA, area_id: areaA, name: "Project A", archived_at: null }, { id: entityTwo, user_id: userA, area_id: areaA, name: "Team", archived_at: null });
    await changeSectionContext(entryA, sectionA, { action: "addArea", areaId: areaA });
    await changeSectionContext(entryA, sectionA, { action: "addArea", areaId: areaA });
    expect(tables.section_impact_areas).toHaveLength(1);
    await changeSectionContext(entryA, sectionA, { action: "addEntity", areaId: areaA, entityId: entityOne });
    await changeSectionContext(entryA, sectionA, { action: "addEntity", areaId: areaA, entityId: entityTwo });
    expect(tables.section_impact_entities).toHaveLength(2);
    await changeSectionContext(entryA, sectionA, { action: "removeEntity", areaId: areaA, entityId: entityOne });
    expect(tables.section_impact_entities).toHaveLength(1);
  });
  it("allows renaming a used entity but refuses moving it to another area", async () => {
    const entity = "00000000-0000-4000-8000-000000000055";
    const otherArea = "00000000-0000-4000-8000-000000000043";
    tables.impact_areas.push({ id: otherArea, user_id: userA, name: "People", archived_at: null });
    tables.impact_entities.push({ id: entity, user_id: userA, area_id: areaA, name: "Project", archived_at: null });
    tables.section_impact_entities.push({ id: "link", user_id: userA, entity_id: entity });
    expect((await updateImpactEntity(entity, { name: "Project Alpha", areaId: areaA })).name).toBe("Project Alpha");
    await expect(updateImpactEntity(entity, { areaId: otherArea })).rejects.toThrow("already used");
  });
});
