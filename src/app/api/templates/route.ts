import { NextRequest } from "next/server";
import { userDb } from "@/lib/db";
import { privateJson, sameOrigin } from "@/lib/http";
import { z } from "zod";
export const runtime = "nodejs";
const schema = z.object({ name: z.string().trim().min(1).max(100), text: z.string().max(20000), journalId: z.uuid().nullable().optional() }).strict();
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  try { const value = schema.parse(await request.json()); const { db, user } = await userDb(); const { data, error } = await db.from("entry_templates").insert({ user_id: user.id, name: value.name, journal_id: value.journalId || null, content: { type: "doc", content: value.text.split("\n").map(line => ({ type: "paragraph", content: line ? [{ type: "text", text: line }] : [] })) } }).select("id").single(); if (error) throw error; return privateJson(data, 201); }
  catch { return privateJson({ error: "Could not create template." }, 400); }
}
