"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
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

type Template = { id: string; name: string; content: Record<string, unknown>; journal_id: string | null };
export function TemplateManager({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function create(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try { const response = await fetch("/api/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, text: content }) }); if (!response.ok) throw new Error(); setName(""); setContent(""); router.refresh(); }
    catch { setMessage("Could not create template. Please try again."); }
    finally { setBusy(false); }
  }
  async function remove() { if (!pendingDelete) return; const response = await fetch(`/api/templates/${pendingDelete}`, { method: "DELETE" }); setPendingDelete(null); if (response.ok) router.refresh(); else setMessage("Could not delete template."); }
  return <Stack spacing={3}>
    <Paper component="form" variant="outlined" onSubmit={create} sx={{ p: { xs: 2, sm: 3 } }}><Stack spacing={2}><Typography variant="h2">Create a template</Typography><TextField label="Name" value={name} onChange={event => setName(event.target.value)} slotProps={{ htmlInput: { maxLength: 100 } }} placeholder="Daily reflection" required/><TextField label="Starting text" multiline minRows={5} value={content} onChange={event => setContent(event.target.value)} placeholder="What happened today?"/><Button type="submit" variant="contained" disabled={busy} sx={{ alignSelf: "flex-start" }}>{busy ? "Saving…" : "Save template"}</Button></Stack></Paper>
    {message && <Alert severity="error" role="alert">{message}</Alert>}
    <div className="section-heading"><h2>Your templates</h2><span>{templates.length}</span></div>
    {templates.length ? <div className="journal-grid">{templates.map(template => <Paper component="article" variant="outlined" sx={{ p: 2.5 }} key={template.id}><Stack spacing={2}><Typography variant="h3">{template.name}</Typography><Typography color="text.secondary">Ready whenever you are.</Typography><Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}><Button component={Link} href={`/entries/new?template=${template.id}`}>Use template</Button><Button color="error" onClick={() => setPendingDelete(template.id)}>Delete</Button></Stack></Stack></Paper>)}</div> : <Typography color="text.secondary">Save a structure you would like to return to.</Typography>}
    <Dialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)} aria-labelledby="delete-template-title"><DialogTitle id="delete-template-title">Delete template?</DialogTitle><DialogContent>You can create a new template later.</DialogContent><DialogActions><Button onClick={() => setPendingDelete(null)}>Cancel</Button><Button variant="contained" color="error" onClick={() => void remove()}>Delete</Button></DialogActions></Dialog>
  </Stack>;
}
