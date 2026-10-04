"use client";
/* Authenticated file streams cannot be fetched by Next's unauthenticated image optimizer. */
/* eslint-disable @next/next/no-img-element */
import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
type Attachment = { id: string; type: string; file_name: string; mime_type: string; caption?: string | null };
export function AttachmentList({ attachments, editable = false }: { attachments: Attachment[]; editable?: boolean }) {
  const router = useRouter(); const [busy, setBusy] = useState<string | null>(null); const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  async function remove() { if (!pendingDelete) return; setBusy(pendingDelete); const response = await fetch(`/api/attachments/${pendingDelete}`, { method: "DELETE" }); setBusy(null); setPendingDelete(null); if (response.ok) router.refresh(); }
  if (!attachments.length) return null;
  return <><div className="attachment-grid">{attachments.map(item => <div className="attachment-card" key={item.id}>{item.type === "IMAGE" ? <a href={`/api/attachments/${item.id}/content`} target="_blank" rel="noreferrer"><img alt={item.caption || item.file_name} src={`/api/attachments/${item.id}/content`} loading="lazy" /></a> : item.type === "VIDEO" ? <video controls preload="none" src={`/api/attachments/${item.id}/content`} /> : item.type === "AUDIO" ? <audio controls preload="none" src={`/api/attachments/${item.id}/content`} /> : <a className="file-tile" href={`/api/attachments/${item.id}/content`} target="_blank" rel="noreferrer">↗ {item.file_name}</a>}<div className="between"><small>{item.file_name}</small>{editable && <Button color="error" disabled={busy === item.id} onClick={() => setPendingDelete(item.id)}>Delete</Button>}</div></div>)}</div><Dialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)} aria-labelledby="delete-file-title"><DialogTitle id="delete-file-title">Delete file permanently?</DialogTitle><DialogContent>This file cannot be recovered.</DialogContent><DialogActions><Button onClick={() => setPendingDelete(null)}>Cancel</Button><Button variant="contained" color="error" onClick={() => void remove()}>Delete</Button></DialogActions></Dialog></>;
}
