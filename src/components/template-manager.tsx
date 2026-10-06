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
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { MoreHorizontal, Plus } from "lucide-react";

type Template = { id: string; name: string; content: Record<string, unknown>; journal_id: string | null };
export function TemplateManager({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuTemplate, setMenuTemplate] = useState<Template | null>(null);
  const [busy, setBusy] = useState(false);
  async function create(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try { const response = await fetch("/api/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, text: content }) }); if (!response.ok) throw new Error(); setName(""); setContent(""); setCreateOpen(false); router.refresh(); }
    catch { setMessage("Could not create template. Please try again."); }
    finally { setBusy(false); }
  }
  async function remove() { if (!pendingDelete) return; const response = await fetch(`/api/templates/${pendingDelete}`, { method: "DELETE" }); setPendingDelete(null); if (response.ok) router.refresh(); else setMessage("Could not delete template."); }
  return <div className="manager-view">
    <div className="manager-actions"><Button variant="contained" startIcon={<Plus size={17}/>} onClick={() => { setMessage(""); setCreateOpen(true); }}>New template</Button></div>
    {message && <Alert severity="error" role="alert">{message}</Alert>}
    {templates.length ? <div className="manager-list">{templates.map(template => <article className="manager-row" key={template.id}>
      <div className="manager-row-main"><strong>{template.name}</strong><span>Ready whenever you are.</span></div>
      <Button component={Link} href={`/entries/new?template=${template.id}`} size="small">Use</Button>
      <IconButton aria-label={`Actions for ${template.name}`} aria-haspopup="menu" onClick={event => { setMenuAnchor(event.currentTarget); setMenuTemplate(template); }}><MoreHorizontal size={19}/></IconButton>
    </article>)}</div> : <p className="muted">Save a structure you would like to return to.</p>}
    <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
      {menuTemplate && <MenuItem component={Link} href={`/entries/new?template=${menuTemplate.id}`} onClick={() => setMenuAnchor(null)}>Use template</MenuItem>}
      <MenuItem sx={{ color: "error.main" }} onClick={() => { setPendingDelete(menuTemplate?.id || null); setMenuAnchor(null); }}>Delete</MenuItem>
    </Menu>
    <Dialog open={createOpen} onClose={() => setCreateOpen(false)} aria-labelledby="create-template-title"><DialogTitle id="create-template-title">New template</DialogTitle><DialogContent><Stack component="form" id="create-template-form" spacing={2} onSubmit={create} sx={{ pt: 1 }}>
      <TextField label="Name" value={name} onChange={event => setName(event.target.value)} slotProps={{ htmlInput: { maxLength: 100 } }} placeholder="Daily reflection" required autoFocus/>
      <TextField label="Starting text" multiline minRows={4} value={content} onChange={event => setContent(event.target.value)} placeholder="What happened today?"/>
      {message && <Alert severity="error" role="alert">{message}</Alert>}
    </Stack></DialogContent><DialogActions><Button onClick={() => setCreateOpen(false)}>Cancel</Button><Button type="submit" form="create-template-form" variant="contained" disabled={busy}>{busy ? "Saving…" : "Save template"}</Button></DialogActions></Dialog>
    <Dialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)} aria-labelledby="delete-template-title"><DialogTitle id="delete-template-title">Delete template?</DialogTitle><DialogContent>You can create a new template later.</DialogContent><DialogActions><Button onClick={() => setPendingDelete(null)}>Cancel</Button><Button variant="contained" color="error" onClick={() => void remove()}>Delete</Button></DialogActions></Dialog>
  </div>;
}
