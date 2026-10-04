"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
const maxSize = 100 * 1024 * 1024;
function mediaType(file: File) { if (file.type.startsWith("image/")) return "IMAGE"; if (file.type.startsWith("video/")) return "VIDEO"; if (file.type.startsWith("audio/")) return "AUDIO"; if (file.type === "application/pdf") return "PDF"; return "DOCUMENT"; }
export function AttachmentUploader({ entryId }: { entryId: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [status, setStatus] = useState("");
  async function upload(file: File) {
    if (file.size > maxSize || file.size === 0) { setStatus("Choose a file up to 100 MB."); return; }
    const allowed = ["image/jpeg","image/png","image/webp","image/gif","image/avif"].includes(file.type) || file.type.startsWith("video/") || file.type.startsWith("audio/") || ["application/pdf","text/plain","text/markdown"].includes(file.type);
    if (!allowed) { setStatus("This file type is not supported."); return; }
    setBusy(true); setStatus("Preparing upload…");
    const storage = async (body: unknown) => { const response = await fetch("/api/storage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Upload failed."); return data; };
    try {
      const contentType = file.type || "application/octet-stream";
      const signed = await storage({ action: "upload", fileName: file.name, contentType, size: file.size });
      setStatus("Uploading…");
      const put = await fetch(signed.url, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
      if (!put.ok) throw new Error("Upload failed. Check bucket CORS settings.");
      await storage({ action: "finalize", fileId: signed.fileId, objectKey: signed.objectKey, fileName: file.name, contentType, size: file.size });
      const response = await fetch("/api/attachments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entryId, fileId: signed.fileId, type: mediaType(file) }) });
      if (!response.ok) throw new Error("Uploaded file could not be linked to the entry.");
      setStatus("Attached"); router.refresh();
    } catch (error) { setStatus(error instanceof Error ? error.message : "Upload failed."); }
    finally { setBusy(false); }
  }
  return <div className="attachment-upload"><Button component="label" variant="outlined" disabled={busy}>+ Add photo or file<input type="file" accept="image/*,video/*,audio/*,.pdf,.txt,.md" hidden disabled={busy} onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); event.currentTarget.value = ""; }} /></Button>{status && <Typography variant="body2" color="text.secondary" role="status">{status}</Typography>}</div>;
}
