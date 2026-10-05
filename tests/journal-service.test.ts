import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ db: null as unknown }));
vi.mock("server-only", () => ({}));
vi.mock("../src/lib/db", () => ({ userDb: async () => ({ db: state.db, user: { id: "00000000-0000-4000-8000-000000000001" } }) }));

import { createEntry } from "../src/lib/journal-service";

const journalId = "00000000-0000-4000-8000-000000000010";
const entryId = "00000000-0000-4000-8000-000000000020";
const content = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "A prompt to remember" }] }] };
const input = { journalId, title: "Morning", content, entryDate: "2026-10-05T04:30:00.000Z", localDate: "2026-10-05", timezone: "Asia/Kolkata" };

function fakeDb(rpcResult: { data: string | null; error: { code: string } | null }, sectionError: { message: string } | null = null) {
  const insertedEntries: Record<string, unknown>[] = [];
  const insertedSections: Record<string, unknown>[] = [];
  const deletedEntries: string[] = [];
  const rpc = vi.fn(async () => rpcResult);
  const db = {
    rpc,
    from(table: string) {
      if (table === "journals") return { select: () => ({ eq: () => ({ eq: () => ({ is: () => ({ maybeSingle: async () => ({ data: { id: journalId } }) }) }) }) }) };
      if (table === "entries") return {
        insert: (row: Record<string, unknown>) => { insertedEntries.push(row); return { select: () => ({ single: async () => ({ data: { id: entryId }, error: null }) }) }; },
        delete: () => ({ eq: () => ({ eq: async () => { deletedEntries.push(entryId); return { error: null }; } }) }),
      };
      if (table === "entry_sections") return { insert: async (row: Record<string, unknown>) => { insertedSections.push(row); return { error: sectionError }; } };
      throw new Error(`Unexpected table ${table}`);
    },
  };
  state.db = db;
  return { rpc, insertedEntries, insertedSections, deletedEntries };
}

beforeEach(() => { state.db = null; });

describe("new entry creation", () => {
  it("creates the first section atomically when the database function is available", async () => {
    const db = fakeDb({ data: entryId, error: null });
    expect(await createEntry(input)).toEqual({ id: entryId });
    expect(db.rpc).toHaveBeenCalledWith("create_entry_with_section", expect.objectContaining({ p_section_content: content, p_section_text: "A prompt to remember" }));
    expect(db.insertedEntries).toHaveLength(0);
  });

  it("creates a first section when the new function has not been migrated yet", async () => {
    const db = fakeDb({ data: null, error: { code: "PGRST202" } });
    expect(await createEntry(input)).toEqual({ id: entryId });
    expect(db.insertedEntries[0]).toMatchObject({ title: "Morning", journal_id: journalId, content_text: "" });
    expect(db.insertedSections[0]).toMatchObject({ entry_id: entryId, content, content_text: "A prompt to remember", position: 0 });
  });

  it("removes an incomplete entry if its first section cannot be saved", async () => {
    const db = fakeDb({ data: null, error: { code: "PGRST202" } }, { message: "section unavailable" });
    await expect(createEntry(input)).rejects.toMatchObject({ message: "section unavailable" });
    expect(db.deletedEntries).toEqual([entryId]);
  });
});
