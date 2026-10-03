"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zonedLocalToIso } from "@/lib/zoned-time";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
export function NewEntry({ journals, template, prompt }: { journals: { id: string; name: string }[]; template?: { content: Record<string, unknown>; journal_id: string | null } | null; prompt?: string }) {
  const router = useRouter(); const [journalId, setJournalId] = useState(journals.find(journal => journal.id === template?.journal_id)?.id || journals[0]?.id || ""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [local, setLocal] = useState(() => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}T${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`; });
  async function create() { const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; setBusy(true); setError(""); try { const content = template?.content || (prompt ? { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: prompt }] }, { type: "paragraph" }] } : undefined); const response = await fetch("/api/entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ journalId, timezone, entryDate: zonedLocalToIso(local, timezone), localDate: local.slice(0,10), content }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not create entry."); router.push(`/entries/${data.id}/edit`); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create entry."); setBusy(false); } }
  return <Paper className="panel stack" elevation={0} style={{ maxWidth: 560 }}>{journals.length > 1 && <TextField select label="Journal" value={journalId} onChange={event => setJournalId(event.target.value)}>{journals.map(j => <MenuItem key={j.id} value={j.id}>{j.name}</MenuItem>)}</TextField>}<TextField label="Date and time" type="datetime-local" value={local} onChange={event => setLocal(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />{error && <p className="form-message" role="alert">{error}</p>}<Button variant="contained" disabled={!journalId || busy} onClick={() => void create()}>{busy ? "Opening…" : "Begin writing"}</Button></Paper>;
}
