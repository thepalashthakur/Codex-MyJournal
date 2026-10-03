import { NextRequest } from "next/server";
import { deleteJournal, updateJournal } from "@/lib/journal-service";
import { privateJson, sameOrigin } from "@/lib/http";
export const runtime = "nodejs";
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  try { return privateJson(await updateJournal((await params).id, await request.json())); }
  catch { return privateJson({ error: "Could not update journal." }, 400); }
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  try { await deleteJournal((await params).id); return privateJson({ ok: true }); }
  catch (error) { return privateJson({ error: error instanceof Error && error.message.startsWith("Move or delete") ? error.message : "Could not delete journal." }, 400); }
}
