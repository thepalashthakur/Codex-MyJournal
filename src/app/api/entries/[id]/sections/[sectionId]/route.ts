import { NextRequest } from "next/server";
import { deleteEntrySection, updateEntrySection } from "@/lib/context-service";
import { privateJson, sameOrigin } from "@/lib/http";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string; sectionId: string }> };
export async function PATCH(request: NextRequest, { params }: Context) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  const { id, sectionId } = await params;
  try { return privateJson(await updateEntrySection(id, sectionId, await request.json())); }
  catch (error) { const conflict = error instanceof Error && error.message === "SECTION_VERSION_CONFLICT"; return privateJson({ error: conflict ? "This section changed elsewhere. Copy your text before refreshing." : "Could not save section." }, conflict ? 409 : 400); }
}
export async function DELETE(request: NextRequest, { params }: Context) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  try { const { id, sectionId } = await params; await deleteEntrySection(id, sectionId); return privateJson({ ok: true }); }
  catch { return privateJson({ error: "Could not delete section." }, 400); }
}
