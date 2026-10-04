import { NextRequest } from "next/server";
import { privateJson, sameOrigin } from "@/lib/http";
import {
  deleteEmotion, deleteImpactArea, deleteImpactEntity, updateEmotion, updateImpactArea, updateImpactEntity,
} from "@/lib/context-service";

export const runtime = "nodejs";
type Context = { params: Promise<{ resource: string; id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  try {
    const { resource, id } = await params; const body = await request.json();
    if (resource === "emotions") return privateJson(await updateEmotion(id, body));
    if (resource === "areas") return privateJson(await updateImpactArea(id, body));
    if (resource === "entities") return privateJson(await updateImpactEntity(id, body));
    return privateJson({ error: "Not found." }, 404);
  } catch (error) { return privateJson({ error: error instanceof Error ? error.message : "Could not update item." }, 400); }
}
export async function DELETE(request: NextRequest, { params }: Context) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  try {
    const { resource, id } = await params;
    if (resource === "emotions") return privateJson(await deleteEmotion(id));
    if (resource === "areas") return privateJson(await deleteImpactArea(id));
    if (resource === "entities") return privateJson(await deleteImpactEntity(id));
    return privateJson({ error: "Not found." }, 404);
  } catch (error) { return privateJson({ error: error instanceof Error ? error.message : "Could not delete item." }, 400); }
}
