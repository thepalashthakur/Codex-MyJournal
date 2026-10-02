"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zonedLocalToIso } from "@/lib/zoned-time";
export function NewEntry({ journals }: { journals: { id: string; name: string }[] }) {
  const router = useRouter(); const [journalId, setJournalId] = useState(journals[0]?.id || ""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [local, setLocal] = useState(() => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}T${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`; });
  async function create() { const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; setBusy(true); setError(""); try { const response = await fetch("/api/entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ journalId, timezone, entryDate: zonedLocalToIso(local, timezone), localDate: local.slice(0,10) }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not create entry."); router.push(`/entries/${data.id}/edit`); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create entry."); setBusy(false); } }
  return <div className="panel stack" style={{ maxWidth: 560 }}><label>Journal<select value={journalId} onChange={event => setJournalId(event.target.value)}>{journals.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}</select></label><label>Date and time<input type="datetime-local" value={local} onChange={event => setLocal(event.target.value)} /></label>{error && <p className="form-message" role="alert">{error}</p>}<button className="button primary" disabled={!journalId || busy} onClick={() => void create()}>{busy ? "Opening…" : "Begin writing"}</button></div>;
}
