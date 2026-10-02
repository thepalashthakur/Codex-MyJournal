import { z } from "zod";
export const uuid = z.uuid();
export const journalInput = z.object({ name: z.string().trim().min(1).max(100), description: z.string().max(500).optional(), color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#a88767"), collectionId: uuid.nullable().optional() });
export const entryDraft = z.object({
  id: uuid, revision: z.number().int().positive(), journalId: uuid,
  title: z.string().max(300), content: z.record(z.string(), z.unknown()), contentText: z.string().max(500000),
  entryDate: z.iso.datetime({ offset: true }), localDate: z.iso.date(), timezone: z.string().min(1).max(100),
  isFavorite: z.boolean(),
});
export const createEntryInput = z.object({ journalId: uuid, timezone: z.string().min(1).max(100), entryDate: z.iso.datetime({ offset: true }), localDate: z.iso.date(), title: z.string().max(300).default(""), content: z.record(z.string(), z.unknown()).optional() });
export const tagName = z.string().trim().min(1).max(60);
