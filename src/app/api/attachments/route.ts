import { NextRequest } from "next/server";
import { userDb } from "@/lib/db";
import { privateJson, sameOrigin } from "@/lib/http";
import { z } from "zod";
export const runtime = "nodejs";
const schema = z.object({ entryId: z.uuid(), fileId: z.uuid(), type: z.enum(["IMAGE","VIDEO","AUDIO","DOCUMENT","PDF","DRAWING","OTHER"]), caption: z.string().max(500).optional() }).strict();
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  try {
    const body = schema.parse(await request.json()); const { db, user } = await userDb();
    const [{ data: entry }, { data: file }] = await Promise.all([
      db.from("entries").select("id").eq("id", body.entryId).eq("user_id", user.id).is("deleted_at", null).maybeSingle(),
      db.from("files").select("id,file_name,content_type,size_bytes").eq("id", body.fileId).eq("user_id", user.id).maybeSingle(),
    ]);
    if (!entry || !file) return privateJson({ error: "Entry or file not found." }, 404);
    const mime = file.content_type;
    const allowedImage = ["image/jpeg","image/png","image/webp","image/gif","image/avif"].includes(mime);
    const allowed = allowedImage || mime.startsWith("video/") || mime.startsWith("audio/") || ["application/pdf","text/plain","text/markdown"].includes(mime);
    if (!allowed || file.size_bytes > 100 * 1024 * 1024) return privateJson({ error: "Unsupported file." }, 400);
    const expectedType = allowedImage ? "IMAGE" : mime.startsWith("video/") ? "VIDEO" : mime.startsWith("audio/") ? "AUDIO" : mime === "application/pdf" ? "PDF" : "DOCUMENT";
    if (body.type !== expectedType) return privateJson({ error: "File type mismatch." }, 400);
    const { data, error } = await db.from("attachments").insert({ user_id: user.id, entry_id: entry.id, file_id: file.id, type: body.type, caption: body.caption || null, file_name: file.file_name, mime_type: file.content_type, size_bytes: file.size_bytes }).select("id").single();
    if (error) throw error; return privateJson(data, 201);
  } catch { return privateJson({ error: "Could not attach file." }, 400); }
}
