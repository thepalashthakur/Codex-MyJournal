import { NextRequest } from "next/server";
import { privateJson, sameOrigin } from "@/lib/http";
import {
  createEmotion, createImpactArea, createImpactEntity, listEmotionLibrary, listImpactLibrary,
} from "@/lib/context-service";

export const runtime = "nodejs";
type Context = { params: Promise<{ resource: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { resource } = await params;
    if (resource === "emotions") return privateJson({ data: await listEmotionLibrary() });
    if (resource === "impacts") return privateJson(await listImpactLibrary());
    return privateJson({ error: "Not found." }, 404);
  } catch { return privateJson({ error: "Could not load your context library." }, 400); }
}
export async function POST(request: NextRequest, { params }: Context) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  try {
    const { resource } = await params; const body = await request.json();
    if (resource === "emotions") return privateJson(await createEmotion(body), 201);
    if (resource === "areas") return privateJson(await createImpactArea(body), 201);
    if (resource === "entities") return privateJson(await createImpactEntity(body), 201);
    return privateJson({ error: "Not found." }, 404);
  } catch (error) { return privateJson({ error: error instanceof Error ? error.message : "Could not create item." }, 400); }
}
