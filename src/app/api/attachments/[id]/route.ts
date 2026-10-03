import { NextRequest } from "next/server";
import { userDb } from "@/lib/db";
import { storageRequest } from "@/lib/storage";
import { privateJson, sameOrigin } from "@/lib/http";
import { z } from "zod";
export const runtime = "nodejs";
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  try {
    const id = z.uuid().parse((await params).id); const { db, user } = await userDb();
    const { data: attachment } = await db.from("attachments").select("id,file_id").eq("id", id).eq("user_id", user.id).maybeSingle();
    if (!attachment) return privateJson({ error: "Attachment not found." }, 404);
    const { error: queueError } = await db.from("attachment_cleanup").upsert({ user_id: user.id, file_id: attachment.file_id }, { onConflict: "file_id" });
    if (queueError) throw queueError;
    const { error: unlinkError } = await db.from("attachments").delete().eq("id", id).eq("user_id", user.id);
    if (unlinkError) throw unlinkError;
    try { await storageRequest({ action: "delete", fileId: attachment.file_id }); await db.from("attachment_cleanup").delete().eq("file_id", attachment.file_id).eq("user_id", user.id); }
    catch { await db.from("attachment_cleanup").update({ last_error_at: new Date().toISOString() }).eq("file_id", attachment.file_id).eq("user_id", user.id); }
    return privateJson({ ok: true });
  } catch { return privateJson({ error: "Could not delete attachment." }, 400); }
}
