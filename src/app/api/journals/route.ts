import { NextRequest } from "next/server";
import { createJournal } from "@/lib/journal-service";
import { privateJson, sameOrigin } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  try { return privateJson(await createJournal(await request.json()), 201); }
  catch { return privateJson({ error: "Could not create journal." }, 400); }
}
