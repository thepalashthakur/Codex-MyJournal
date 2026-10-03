import { NextRequest } from "next/server";
import { userDb } from "@/lib/db";
import { storageRequest } from "@/lib/storage";
import { privateJson, sameOrigin } from "@/lib/http";
import { z } from "zod";
export const runtime = "nodejs";
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  try { const id = z.uuid().parse((await params).id); const { db, user } = await userDb();
    const { data: entry } = await db.from("entries").select("id").eq("id", id).eq("user_id", user.id).not("deleted_at", "is", null).maybeSingle();
    if (!entry) return privateJson({ error: "Entry not found in Trash." }, 404);
    const { data: attachments, error: listError } = await db.from("attachments").select("file_id").eq("entry_id", id).eq("user_id", user.id);
    if (listError) throw listError;
    if (attachments?.length) { const { error } = await db.from("attachment_cleanup").upsert(attachments.map(item => ({ user_id: user.id, file_id: item.file_id })), { onConflict: "file_id" }); if (error) throw error; }
    const { error } = await db.from("entries").delete().eq("id", id).eq("user_id", user.id); if (error) throw error;
    for (const item of attachments || []) { try { await storageRequest({ action: "delete", fileId: item.file_id }); await db.from("attachment_cleanup").delete().eq("file_id", item.file_id).eq("user_id", user.id); } catch { await db.from("attachment_cleanup").update({ last_error_at: new Date().toISOString() }).eq("file_id", item.file_id).eq("user_id", user.id); } }
    return privateJson({ ok: true });
  } catch { return privateJson({ error: "Could not delete entry permanently." }, 400); }
}
