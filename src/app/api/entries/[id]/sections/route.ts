import { NextRequest } from "next/server";
import { createEntrySection, listEntrySections, reorderEntrySections } from "@/lib/context-service";
import { privateJson, sameOrigin } from "@/lib/http";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: NextRequest, { params }: Context) {
  try { return privateJson({ data: await listEntrySections((await params).id) }); }
  catch { return privateJson({ error: "Could not load sections." }, 400); }
}
export async function POST(request: NextRequest, { params }: Context) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  try { return privateJson(await createEntrySection((await params).id, await request.json()), 201); }
  catch (error) { return privateJson({ error: error instanceof Error ? error.message : "Could not create section." }, 400); }
}
export async function PUT(request: NextRequest, { params }: Context) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  try { await reorderEntrySections((await params).id, await request.json()); return privateJson({ ok: true }); }
  catch (error) { return privateJson({ error: error instanceof Error ? error.message : "Could not reorder sections." }, 400); }
}
