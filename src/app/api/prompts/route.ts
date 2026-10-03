import { NextRequest } from "next/server";
import { userDb } from "@/lib/db";
import { privateJson, sameOrigin } from "@/lib/http";
import { z } from "zod";
export const runtime = "nodejs";
export async function POST(request: NextRequest) { if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403); try { const value = z.object({ text: z.string().trim().min(1).max(500), category: z.string().max(100).optional() }).strict().parse(await request.json()); const { db, user } = await userDb(); const { data, error } = await db.from("prompts").insert({ user_id: user.id, text: value.text, category: value.category || null }).select("id").single(); if (error) throw error; return privateJson(data, 201); } catch { return privateJson({ error: "Could not save prompt." }, 400); } }
