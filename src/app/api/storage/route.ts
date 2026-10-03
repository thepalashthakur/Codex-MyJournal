import { NextRequest } from "next/server";
import { storageRequest } from "@/lib/storage";
import { privateJson, sameOrigin } from "@/lib/http";
import { z } from "zod";
export const runtime = "nodejs";
const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("upload"), fileName: z.string().min(1).max(180), contentType: z.string().min(1).max(120), size: z.number().int().positive().max(100 * 1024 * 1024) }),
  z.object({ action: z.literal("finalize"), fileId: z.uuid(), objectKey: z.string().min(1), fileName: z.string().min(1), contentType: z.string().min(1), size: z.number().int().positive().max(100 * 1024 * 1024) }),
  z.object({ action: z.literal("download"), fileId: z.uuid() }),
]);
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  try { const body = requestSchema.parse(await request.json()); return privateJson(await storageRequest(body)); }
  catch { return privateJson({ error: "Media request failed." }, 400); }
}
