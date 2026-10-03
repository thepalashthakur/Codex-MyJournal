import { NextRequest } from "next/server";
import { userDb } from "@/lib/db";
import { storageRequest } from "@/lib/storage";
import { z } from "zod";
export const runtime = "nodejs";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = z.uuid().parse((await params).id); const { db, user } = await userDb();
    const { data: attachment } = await db.from("attachments").select("file_id,mime_type,file_name,entries!inner(deleted_at)").eq("id", id).eq("user_id", user.id).is("entries.deleted_at", null).maybeSingle();
    if (!attachment) return new Response("Not found", { status: 404 });
    const signed = await storageRequest({ action: "download", fileId: attachment.file_id });
    if (!signed.url) throw new Error("Missing signed URL.");
    const range = request.headers.get("range");
    const upstream = await fetch(signed.url, { cache: "no-store", headers: range ? { Range: range } : undefined });
    if (!upstream.ok || !upstream.body) throw new Error("File unavailable.");
    const safeInline = ["image/jpeg","image/png","image/webp","image/gif","image/avif"].includes(attachment.mime_type) || attachment.mime_type.startsWith("video/") || attachment.mime_type.startsWith("audio/");
    const disposition = safeInline ? "inline" : "attachment";
    const headers = new Headers({ "Content-Type": attachment.mime_type, "Content-Disposition": `${disposition}; filename="${attachment.file_name.replace(/[^a-zA-Z0-9._-]/g,"_")}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox" });
    for (const name of ["content-range", "content-length", "accept-ranges"]) { const value = upstream.headers.get(name); if (value) headers.set(name, value); }
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch { return new Response("Not found", { status: 404 }); }
}
