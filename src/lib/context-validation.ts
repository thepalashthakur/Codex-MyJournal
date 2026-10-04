import { z } from "zod";

export const id = z.uuid();
export const name = z.string().trim().min(1).max(80);
export const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const emotionCreate = z.object({ name, color: color.default("#7A8291"), parentId: id.nullable().default(null) });
export const emotionPatch = z.object({ name: name.optional(), color: color.optional(), parentId: id.nullable().optional(), position: z.number().int().min(0).optional(), hidden: z.boolean().optional(), archived: z.boolean().optional() });
export const impactAreaCreate = z.object({ name, color: color.default("#7A8291") });
export const impactAreaPatch = z.object({ name: name.optional(), color: color.optional(), position: z.number().int().min(0).optional(), archived: z.boolean().optional() });
export const impactEntityCreate = z.object({ name, areaId: id });
export const impactEntityPatch = z.object({ name: name.optional(), areaId: id.optional(), position: z.number().int().min(0).optional(), archived: z.boolean().optional() });
export const sectionCreate = z.object({ title: z.string().max(200).default(""), duplicateFrom: id.optional() });
export const sectionPatch = z.object({ revision: z.number().int().positive(), title: z.string().max(200), content: z.record(z.string(), z.unknown()), contentText: z.string().max(500000) });
export const sectionOrder = z.object({ ids: z.array(id).max(100) });
export const sectionContextAction = z.discriminatedUnion("action", [
  z.object({ action: z.literal("setEmotion"), emotionId: id.nullable(), intensity: z.number().int().min(1).max(10).nullable().default(null) }),
  z.object({ action: z.literal("addArea"), areaId: id }),
  z.object({ action: z.literal("removeArea"), areaId: id }),
  z.object({ action: z.literal("addEntity"), areaId: id, entityId: id }),
  z.object({ action: z.literal("removeEntity"), areaId: id, entityId: id }),
]);
