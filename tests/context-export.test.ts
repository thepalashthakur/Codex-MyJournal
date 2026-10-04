import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { sectionsForMarkdown } from "../src/lib/context-export";

describe("Markdown context export", () => {
  it("groups ordered sections and historical snapshot labels with their entry", async () => {
    const rows = {
      entry_sections: [{ id: "section-1", entry_id: "entry-1", title: "Work", content_text: "A difficult meeting", position: 0 }],
      section_emotions: [{ section_id: "section-1", emotion_name: "Disappointed", intensity: 6 }],
      section_impact_areas: [{ id: "impact-1", section_id: "section-1", area_name: "Work" }],
      section_impact_entities: [{ section_impact_area_id: "impact-1", entity_name: "Project Alpha" }],
    };
    const db = { from: (table: keyof typeof rows) => {
      const query = {
        select: () => query, eq: () => query, in: () => query, is: () => query, order: () => query,
        range: async () => ({ data: rows[table], error: null }),
        then: (resolve: (result: { data: unknown[]; error: null }) => unknown) => Promise.resolve({ data: rows[table], error: null }).then(resolve),
      };
      return query;
    } };
    const result = await sectionsForMarkdown(db as Parameters<typeof sectionsForMarkdown>[0], "user-1", ["entry-1"]);
    expect(result.get("entry-1")).toEqual([{ ...rows.entry_sections[0], emotion: { section_id: "section-1", emotion_name: "Disappointed", intensity: 6 }, impacts: [{ area_name: "Work", entities: ["Project Alpha"] }] }]);
  });
});
