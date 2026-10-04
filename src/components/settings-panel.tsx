"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

type Prompt = { id: string; text: string };
type Trashed = { id: string; title: string; local_date: string };

export function SettingsPanel({ email, prompts, trashed }: { email: string; prompts: Prompt[]; trashed: Trashed[] }) {
  const router = useRouter();
  const [theme, setTheme] = useState("system");
  const [prompt, setPrompt] = useState("");
  const [message, setMessage] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  useEffect(() => { const task = setTimeout(() => setTheme(localStorage.getItem("stillroom-theme") || "system"), 0); return () => clearTimeout(task); }, []);
  function chooseTheme(value: string) { setTheme(value); localStorage.setItem("stillroom-theme", value); document.documentElement.dataset.theme = value; }
  async function signOut() { await fetch("/api/auth/sign-out", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); router.push("/sign-in"); }
  async function addPrompt(event: FormEvent) { event.preventDefault(); const response = await fetch("/api/prompts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: prompt }) }); if (response.ok) { setPrompt(""); router.refresh(); } else setMessage("Could not save prompt."); }
  async function deletePrompt(id: string) { const response = await fetch(`/api/prompts/${id}`, { method: "DELETE" }); if (response.ok) router.refresh(); else setMessage("Could not delete prompt."); }
  async function restore(id: string) { const response = await fetch(`/api/entries/${id}/restore`, { method: "POST" }); if (response.ok) router.refresh(); else setMessage("Could not restore entry."); }
  async function permanent() { if (!pendingDelete) return; const response = await fetch(`/api/entries/${pendingDelete}/permanent`, { method: "DELETE" }); setPendingDelete(null); if (response.ok) router.refresh(); else setMessage("Could not permanently delete entry."); }
  return <Stack spacing={3}>
    <Paper component="section" variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}><Stack spacing={2}><Typography variant="h2">Appearance</Typography><TextField select label="Theme" value={theme} onChange={event => chooseTheme(event.target.value)} sx={{ maxWidth: 320 }}><MenuItem value="system">System</MenuItem><MenuItem value="light">Light</MenuItem><MenuItem value="dark">Dark</MenuItem></TextField></Stack></Paper>
    <Paper component="section" variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}><Stack spacing={2}><Typography variant="h2">Your data</Typography><Typography color="text.secondary">Download your journal as structured JSON or readable Markdown. Files are available from individual entries.</Typography><Stack direction={{ xs: "column", sm: "row" }} spacing={1}><Button variant="outlined" component="a" href="/api/exports?format=json">Export JSON</Button><Button variant="outlined" component="a" href="/api/exports?format=markdown">Export Markdown</Button></Stack></Stack></Paper>
    <Paper component="section" variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}><Stack spacing={2}><Typography variant="h2">Your prompts</Typography><Stack component="form" direction={{ xs: "column", sm: "row" }} spacing={1} onSubmit={addPrompt}><TextField label="New prompt" value={prompt} onChange={event => setPrompt(event.target.value)} placeholder="A question worth returning to…" slotProps={{ htmlInput: { maxLength: 500 } }} required fullWidth/><Button variant="contained" type="submit">Add</Button></Stack>{prompts.map(item => <Stack key={item.id} direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 2 }}><Typography sx={{ overflowWrap: "anywhere" }}>{item.text}</Typography><Button color="error" onClick={() => void deletePrompt(item.id)}>Delete</Button></Stack>)}{prompts.length === 0 && <Typography color="text.secondary">No prompts saved yet. Add one to use when you write.</Typography>}</Stack></Paper>
    <Paper component="section" variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}><Stack spacing={2}><Typography variant="h2">Trash</Typography>{trashed.length ? trashed.map(item => <Stack key={item.id} direction={{ xs: "column", sm: "row" }} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", gap: 1 }}><Typography>{item.title || "Untitled entry"} · {item.local_date}</Typography><Stack direction="row" spacing={1}><Button variant="outlined" onClick={() => void restore(item.id)}>Restore</Button><Button color="error" onClick={() => setPendingDelete(item.id)}>Delete forever</Button></Stack></Stack>) : <Typography color="text.secondary">Trash is empty.</Typography>}</Stack></Paper>
    <Paper component="section" variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}><Stack spacing={2}><Typography variant="h2">Account</Typography><Typography color="text.secondary">Signed in as {email}</Typography><Button variant="outlined" sx={{ alignSelf: "flex-start" }} onClick={() => void signOut()}>Sign out</Button></Stack></Paper>
    {message && <Alert severity="error" role="alert">{message}</Alert>}
    <Dialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)} aria-labelledby="delete-entry-title"><DialogTitle id="delete-entry-title">Delete entry forever?</DialogTitle><DialogContent>This entry and its files cannot be recovered.</DialogContent><DialogActions><Button onClick={() => setPendingDelete(null)}>Cancel</Button><Button variant="contained" color="error" onClick={() => void permanent()}>Delete forever</Button></DialogActions></Dialog>
  </Stack>;
}
