import { NextRequest } from "next/server";
import { userDb } from "@/lib/db";
import { privateJson, sameOrigin } from "@/lib/http";
import { z } from "zod";
export const runtime = "nodejs";
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403); try { const id = z.uuid().parse((await params).id); const { db, user } = await userDb(); const { error } = await db.from("prompts").delete().eq("id", id).eq("user_id", user.id); if (error) throw error; return privateJson({ ok: true }); } catch { return privateJson({ error: "Could not delete prompt." }, 400); } }
