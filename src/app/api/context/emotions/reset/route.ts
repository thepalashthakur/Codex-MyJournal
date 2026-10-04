import { NextRequest } from "next/server";
import { resetEmotionLibrary } from "@/lib/context-service";
import { privateJson, sameOrigin } from "@/lib/http";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  try { await resetEmotionLibrary(); return privateJson({ ok: true }); }
  catch { return privateJson({ error: "Could not reset emotions." }, 400); }
}
