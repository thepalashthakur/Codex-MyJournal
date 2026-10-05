import { NextRequest } from "next/server";
import { createEntry } from "@/lib/journal-service";
import { privateJson, sameOrigin } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  try { return privateJson(await createEntry(await request.json()), 201); }
  catch (error) {
    console.error("Entry creation failed", error);
    return privateJson({ error: error instanceof Error ? error.message : "Could not create entry." }, 400);
  }
}
