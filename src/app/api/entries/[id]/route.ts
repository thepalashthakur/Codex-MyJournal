import { NextRequest } from "next/server";
import { saveEntry, setEntryDeleted } from "@/lib/journal-service";
import { privateJson, sameOrigin } from "@/lib/http";
export const runtime = "nodejs";
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  const { id } = await params;
  try { const body = await request.json(); if (body.id !== id) return privateJson({ error: "Entry mismatch." }, 400); return privateJson(await saveEntry(body)); }
  catch (error) { const conflict = error instanceof Error && error.message.includes("ENTRY_VERSION_CONFLICT"); return privateJson({ error: conflict ? "This entry changed elsewhere. Copy your text before refreshing." : "Could not save entry." }, conflict ? 409 : 400); }
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  try { await setEntryDeleted((await params).id, true); return privateJson({ ok: true }); }
  catch { return privateJson({ error: "Could not move entry to Trash." }, 400); }
}
