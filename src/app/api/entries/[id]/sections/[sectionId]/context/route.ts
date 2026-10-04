import { NextRequest } from "next/server";
import { changeSectionContext, listEntrySections } from "@/lib/context-service";
import { privateJson, sameOrigin } from "@/lib/http";

export const runtime = "nodejs";
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; sectionId: string }> }) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  try {
    const { id, sectionId } = await params;
    await changeSectionContext(id, sectionId, await request.json());
    const section = (await listEntrySections(id, sectionId))[0];
    return privateJson({ data: section });
  } catch (error) { return privateJson({ error: error instanceof Error ? error.message : "Could not update section context." }, 400); }
}
