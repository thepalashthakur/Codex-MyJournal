import { describe, expect, it } from "vitest";
import { localDateOf, monthBounds, onThisDayFilter } from "../src/lib/dates";
import { isoToZonedLocal, zonedLocalToIso } from "../src/lib/zoned-time";
import { textFromContent } from "../src/lib/content";

describe("journal dates", () => {
  it("groups entries by the chosen timezone across UTC midnight", () => {
    const instant = new Date("2026-10-02T20:00:00.000Z");
    expect(localDateOf(instant, "Asia/Kolkata")).toBe("2026-10-03");
    expect(localDateOf(instant, "America/New_York")).toBe("2026-10-02");
  });
  it("round trips a backdated local time", () => {
    expect(zonedLocalToIso("2024-07-04T21:15", "Asia/Kolkata")).toBe("2024-07-04T15:45:00.000Z");
    expect(isoToZonedLocal("2024-07-04T15:45:00.000Z", "Asia/Kolkata")).toBe("2024-07-04T21:15");
  });
  it("handles month boundaries and leap day explicitly", () => {
    expect(monthBounds("2024-02")).toEqual({ start: "2024-02-01", end: "2024-03-01" });
    expect(onThisDayFilter("2024-02-29")).toEqual({ month: 2, day: 29, leapDay: true });
  });
});

describe("structured content", () => {
  it("extracts durable search and export text without HTML", () => {
    expect(textFromContent({ type: "doc", content: [{ type: "heading", content: [{ type: "text", text: "A day" }] }, { type: "paragraph", content: [{ type: "text", text: "Remember this." }] }] })).toBe("A day\nRemember this.");
  });
});
