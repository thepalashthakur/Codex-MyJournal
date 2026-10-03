"use client";
/* Authenticated file streams cannot be fetched by Next's unauthenticated image optimizer. */
/* eslint-disable @next/next/no-img-element */
import { useRouter } from "next/navigation";
import { useState } from "react";
type Attachment = { id: string; type: string; file_name: string; mime_type: string; caption?: string | null };
export function AttachmentList({ attachments, editable = false }: { attachments: Attachment[]; editable?: boolean }) {
  const router = useRouter(); const [busy, setBusy] = useState<string | null>(null);
  async function remove(id: string) { if (!confirm("Delete this file permanently?")) return; setBusy(id); const response = await fetch(`/api/attachments/${id}`, { method: "DELETE" }); setBusy(null); if (response.ok) router.refresh(); }
  if (!attachments.length) return null;
  return <div className="attachment-grid">{attachments.map(item => <div className="attachment-card" key={item.id}>{item.type === "IMAGE" ? <a href={`/api/attachments/${item.id}/content`} target="_blank" rel="noreferrer"><img alt={item.caption || item.file_name} src={`/api/attachments/${item.id}/content`} loading="lazy" /></a> : item.type === "VIDEO" ? <video controls preload="none" src={`/api/attachments/${item.id}/content`} /> : item.type === "AUDIO" ? <audio controls preload="none" src={`/api/attachments/${item.id}/content`} /> : <a className="file-tile" href={`/api/attachments/${item.id}/content`} target="_blank" rel="noreferrer">↗ {item.file_name}</a>}<div className="between"><small>{item.file_name}</small>{editable && <button className="text-button" disabled={busy === item.id} onClick={() => void remove(item.id)}>Delete</button>}</div></div>)}</div>;
}
