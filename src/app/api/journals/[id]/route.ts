import { NextRequest } from "next/server";
import { updateJournal } from "@/lib/journal-service";
import { privateJson, sameOrigin } from "@/lib/http";
export const runtime = "nodejs";
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  try { return privateJson(await updateJournal((await params).id, await request.json())); }
  catch { return privateJson({ error: "Could not update journal." }, 400); }
}
