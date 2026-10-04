"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

type Journal = { id: string; name: string; description: string | null; color: string; archived_at: string | null; position: number; is_default: boolean };
const colors = ["#245fa6", "#207454", "#6652a3", "#ba3b42"];
export function JournalManager({ journals }: { journals: Journal[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(colors[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Journal | null>(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState<Journal | null>(null);
  async function create(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { const response = await fetch("/api/journals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description, color }) }); if (!response.ok) throw new Error(); setName(""); setDescription(""); router.refresh(); }
    catch { setError("Could not create journal."); }
    finally { setBusy(false); }
  }
  async function update(id: string, patch: Record<string, unknown>) { const response = await fetch(`/api/journals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }); if (response.ok) router.refresh(); else setError("Could not update journal."); }
  async function rename(event: FormEvent) { event.preventDefault(); if (!editing || !editName.trim()) return; await update(editing.id, { name: editName.trim() }); setEditing(null); }
  async function remove() { if (!deleting) return; const response = await fetch(`/api/journals/${deleting.id}`, { method: "DELETE" }); setDeleting(null); if (response.ok) router.refresh(); else setError("Could not delete journal. Move or delete its entries first."); }
  return <Stack spacing={3}>
    <Paper component="form" variant="outlined" onSubmit={create} sx={{ p: { xs: 2, sm: 3 } }}><Stack spacing={2}><Typography variant="h2">Create another journal</Typography><Stack direction={{ xs: "column", md: "row" }} spacing={2}><TextField label="Name" value={name} onChange={event => setName(event.target.value)} placeholder="Personal, Travel, Ideas…" slotProps={{ htmlInput: { maxLength: 100 } }} required fullWidth/><TextField label="Description" value={description} onChange={event => setDescription(event.target.value)} placeholder="What belongs here?" slotProps={{ htmlInput: { maxLength: 500 } }} fullWidth/></Stack><Stack direction="row" spacing={1} role="group" aria-label="Journal color">{colors.map(value => <button key={value} type="button" aria-label={`Color ${value}`} aria-pressed={color === value} onClick={() => setColor(value)} style={{ width: 40, height: 40, borderRadius: "50%", background: value, border: color === value ? "3px solid var(--ink)" : "2px solid var(--surface)", boxShadow: "0 0 0 1px var(--line)" }}/>)}</Stack><Button variant="contained" type="submit" disabled={busy} sx={{ alignSelf: "flex-start" }}>{busy ? "Creating…" : "Create journal"}</Button></Stack></Paper>
    {error && <Alert severity="error" role="alert">{error}</Alert>}
    <div className="journal-grid">{journals.map((journal, index) => <Paper component="article" variant="outlined" sx={{ p: 2.5 }} key={journal.id}><Stack spacing={2}><Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}><span className="journal-dot" style={{ background: journal.color }}/><Stack direction="row" spacing={1}>{journal.is_default && <span className="tag">Default</span>}<Button size="small" onClick={() => { setEditing(journal); setEditName(journal.name); }}>Edit</Button></Stack></Stack><Link href={`/journals/${journal.id}`}><Typography variant="h3">{journal.name}</Typography><Typography color="text.secondary">{journal.description || "A space for what matters."}</Typography></Link><Stack direction="row" sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}><Button component={Link} href={`/journals/${journal.id}`}>View entries</Button>{!journal.is_default && <Button onClick={() => void update(journal.id, { archived: !journal.archived_at })}>{journal.archived_at ? "Restore" : "Archive"}</Button>}</Stack>{!journal.is_default && <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}><Button size="small" disabled={index <= 1} onClick={() => void update(journal.id, { position: journals[index - 1].position - 1 })}>↑ Earlier</Button><Button size="small" disabled={index === journals.length - 1} onClick={() => void update(journal.id, { position: journals[index + 1].position + 1 })}>↓ Later</Button><Button size="small" color="error" onClick={() => setDeleting(journal)}>Delete</Button></Stack>}</Stack></Paper>)}</div>
    <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} aria-labelledby="edit-journal-title"><DialogTitle id="edit-journal-title">Edit journal</DialogTitle><DialogContent><Stack component="form" id="edit-journal-form" spacing={2} onSubmit={rename} sx={{ pt: 1 }}><TextField label="Journal name" value={editName} onChange={event => setEditName(event.target.value)} required fullWidth/></Stack></DialogContent><DialogActions><Button onClick={() => setEditing(null)}>Cancel</Button><Button variant="contained" type="submit" form="edit-journal-form">Save</Button></DialogActions></Dialog>
    <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)} aria-labelledby="delete-journal-title"><DialogTitle id="delete-journal-title">Delete journal?</DialogTitle><DialogContent>Only an empty journal can be deleted.</DialogContent><DialogActions><Button onClick={() => setDeleting(null)}>Cancel</Button><Button variant="contained" color="error" onClick={() => void remove()}>Delete</Button></DialogActions></Dialog>
  </Stack>;
}
