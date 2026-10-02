import { NextRequest } from "next/server";
import { setEntryTags } from "@/lib/journal-service";
import { privateJson, sameOrigin } from "@/lib/http";
export const runtime = "nodejs";
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  try { const body = await request.json(); await setEntryTags((await params).id, body.names); return privateJson({ ok: true }); }
  catch { return privateJson({ error: "Could not update tags." }, 400); }
}
