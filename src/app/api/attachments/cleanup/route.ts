import { NextRequest } from "next/server";
import { userDb } from "@/lib/db";
import { storageRequest } from "@/lib/storage";
import { privateJson, sameOrigin } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  const { db, user } = await userDb();
  const { data: pending } = await db.from("attachment_cleanup").select("file_id").eq("user_id", user.id).order("created_at").limit(20);
  let cleaned = 0;
  for (const item of pending || []) {
    try { await storageRequest({ action: "delete", fileId: item.file_id }); await db.from("attachment_cleanup").delete().eq("file_id", item.file_id).eq("user_id", user.id); cleaned++; }
    catch { await db.from("attachment_cleanup").update({ last_error_at: new Date().toISOString() }).eq("file_id", item.file_id).eq("user_id", user.id); }
  }
  return privateJson({ cleaned });
}
