import { describe, expect, it } from "vitest";
import { validateEmotionPlacement } from "../src/lib/emotion-hierarchy";
import { emotionCreate, emotionPatch, impactAreaCreate, impactEntityCreate, sectionContextAction, sectionCreate, sectionOrder, sectionPatch } from "../src/lib/context-validation";

const root = { id: "root", parent_id: null, archived_at: null };
const child = { id: "child", parent_id: "root", archived_at: null };
const grandchild = { id: "grandchild", parent_id: "child", archived_at: null };
const uid = "00000000-0000-4000-8000-000000000001";

describe("emotion hierarchy", () => {
  it("allows three levels and selecting any level", () => {
    expect(() => validateEmotionPlacement([root, child], null, "child")).not.toThrow();
    expect(() => validateEmotionPlacement([root, child, grandchild], null, null)).not.toThrow();
  });
  it("rejects a fourth level and moves that would make descendants too deep", () => {
    expect(() => validateEmotionPlacement([root, child, grandchild], null, "grandchild")).toThrow("three levels");
    expect(() => validateEmotionPlacement([root, child, grandchild], "child", "grandchild")).toThrow("cycle");
  });
  it("rejects self-parenting, missing parents, and archived parents", () => {
    expect(() => validateEmotionPlacement([root], "root", "root")).toThrow("cycle");
    expect(() => validateEmotionPlacement([root], null, "another-user-id")).toThrow("not available");
    expect(() => validateEmotionPlacement([{ ...root, archived_at: "2026-01-01" }], null, "root")).toThrow("not available");
  });
});

describe("section and context input", () => {
  it("accepts optional section titles and structured content", () => {
    expect(sectionCreate.parse({})).toEqual({ title: "" });
    expect(sectionPatch.parse({ revision: 1, title: "Morning", content: { type: "doc" }, contentText: "Morning" }).revision).toBe(1);
    expect(sectionOrder.parse({ ids: [uid] }).ids).toEqual([uid]);
  });
  it("requires a valid one-to-ten intensity or no intensity", () => {
    expect(sectionContextAction.parse({ action: "setEmotion", emotionId: uid, intensity: 10 }).intensity).toBe(10);
    expect(sectionContextAction.parse({ action: "setEmotion", emotionId: uid }).intensity).toBeNull();
    expect(sectionContextAction.safeParse({ action: "setEmotion", emotionId: uid, intensity: 0 }).success).toBe(false);
    expect(sectionContextAction.safeParse({ action: "setEmotion", emotionId: uid, intensity: 11 }).success).toBe(false);
    expect(sectionContextAction.safeParse({ action: "setEmotion", emotionId: uid, intensity: 3.5 }).success).toBe(false);
  });
  it("validates names, colors, and owned-resource identifier shapes", () => {
    expect(emotionCreate.safeParse({ name: "Hopeful", color: "#123ABC", parentId: uid }).success).toBe(true);
    expect(emotionPatch.safeParse({ color: "red" }).success).toBe(false);
    expect(impactAreaCreate.safeParse({ name: "  " }).success).toBe(false);
    expect(impactEntityCreate.safeParse({ name: "Sarah", areaId: "not-a-uuid" }).success).toBe(false);
    expect(sectionContextAction.safeParse({ action: "addEntity", areaId: uid, entityId: "invalid" }).success).toBe(false);
  });
});
