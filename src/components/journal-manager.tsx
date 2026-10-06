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
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { MoreHorizontal, Plus } from "lucide-react";

type Journal = { id: string; name: string; description: string | null; color: string; archived_at: string | null; position: number; is_default: boolean };
const colors = ["#245fa6", "#207454", "#6652a3", "#ba3b42"];

export function JournalManager({ journals }: { journals: Journal[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(colors[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Journal | null>(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState<Journal | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuJournal, setMenuJournal] = useState<Journal | null>(null);

  async function create(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/journals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description, color }) });
      if (!response.ok) throw new Error();
      setName(""); setDescription(""); setCreateOpen(false); router.refresh();
    } catch { setError("Could not create journal."); }
    finally { setBusy(false); }
  }
  async function update(id: string, patch: Record<string, unknown>) {
    const response = await fetch(`/api/journals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (response.ok) router.refresh(); else setError("Could not update journal.");
  }
  async function rename(event: FormEvent) { event.preventDefault(); if (!editing || !editName.trim()) return; await update(editing.id, { name: editName.trim() }); setEditing(null); }
  async function remove() { if (!deleting) return; const response = await fetch(`/api/journals/${deleting.id}`, { method: "DELETE" }); setDeleting(null); if (response.ok) router.refresh(); else setError("Could not delete journal. Move or delete its entries first."); }
  function closeMenu() { setMenuAnchor(null); setMenuJournal(null); }
  function menuAction(action: () => void) { closeMenu(); action(); }
  const menuIndex = menuJournal ? journals.findIndex(journal => journal.id === menuJournal.id) : -1;

  return <div className="manager-view">
    <div className="manager-actions"><Button variant="contained" startIcon={<Plus size={17}/>} onClick={() => { setError(""); setCreateOpen(true); }}>New journal</Button></div>
    {error && <Alert severity="error" role="alert">{error}</Alert>}
    <div className="manager-list">{journals.map(journal => <article className="manager-row" key={journal.id}>
      <span className="journal-dot" style={{ backgroundColor: journal.color }} aria-hidden="true"/>
      <Link className="manager-row-main" href={`/journals/${journal.id}`}><strong>{journal.name}</strong><span>{journal.description || "A space for what matters."}</span></Link>
      {journal.is_default && <span className="tag">Default</span>}
      {journal.archived_at && <span className="tag">Archived</span>}
      <IconButton aria-label={`Actions for ${journal.name}`} aria-haspopup="menu" onClick={event => { setMenuAnchor(event.currentTarget); setMenuJournal(journal); }}><MoreHorizontal size={19}/></IconButton>
    </article>)}</div>
    <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
      {menuJournal && <MenuItem component={Link} href={`/journals/${menuJournal.id}`} onClick={closeMenu}>View entries</MenuItem>}
      <MenuItem onClick={() => menuAction(() => { if (menuJournal) { setEditing(menuJournal); setEditName(menuJournal.name); } })}>Rename</MenuItem>
      {menuJournal && !menuJournal.is_default && <MenuItem onClick={() => menuAction(() => void update(menuJournal.id, { archived: !menuJournal.archived_at }))}>{menuJournal.archived_at ? "Restore" : "Archive"}</MenuItem>}
      {menuJournal && !menuJournal.is_default && <MenuItem disabled={menuIndex <= 1} onClick={() => menuAction(() => void update(menuJournal.id, { position: journals[menuIndex - 1].position - 1 }))}>Move earlier</MenuItem>}
      {menuJournal && !menuJournal.is_default && <MenuItem disabled={menuIndex === journals.length - 1} onClick={() => menuAction(() => void update(menuJournal.id, { position: journals[menuIndex + 1].position + 1 }))}>Move later</MenuItem>}
      {menuJournal && !menuJournal.is_default && <MenuItem sx={{ color: "error.main" }} onClick={() => menuAction(() => setDeleting(menuJournal))}>Delete</MenuItem>}
    </Menu>
    <Dialog open={createOpen} onClose={() => setCreateOpen(false)} aria-labelledby="create-journal-title"><DialogTitle id="create-journal-title">New journal</DialogTitle><DialogContent><Stack component="form" id="create-journal-form" spacing={2} onSubmit={create} sx={{ pt: 1 }}>
      <TextField label="Name" value={name} onChange={event => setName(event.target.value)} placeholder="Personal, Travel, Ideas…" slotProps={{ htmlInput: { maxLength: 100 } }} required fullWidth autoFocus/>
      <TextField label="Description" value={description} onChange={event => setDescription(event.target.value)} placeholder="What belongs here?" slotProps={{ htmlInput: { maxLength: 500 } }} fullWidth/>
      <div className="journal-color-options" role="group" aria-label="Journal color">{colors.map(value => <button key={value} type="button" aria-label={`Color ${value}`} aria-pressed={color === value} onClick={() => setColor(value)} style={{ backgroundColor: value }}/>)}</div>
      {error && <Alert severity="error" role="alert">{error}</Alert>}
    </Stack></DialogContent><DialogActions><Button onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="contained" type="submit" form="create-journal-form" disabled={busy}>{busy ? "Creating…" : "Create journal"}</Button></DialogActions></Dialog>
    <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} aria-labelledby="edit-journal-title"><DialogTitle id="edit-journal-title">Rename journal</DialogTitle><DialogContent><Stack component="form" id="edit-journal-form" spacing={2} onSubmit={rename} sx={{ pt: 1 }}><TextField label="Journal name" value={editName} onChange={event => setEditName(event.target.value)} required fullWidth/></Stack></DialogContent><DialogActions><Button onClick={() => setEditing(null)}>Cancel</Button><Button variant="contained" type="submit" form="edit-journal-form">Save</Button></DialogActions></Dialog>
    <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)} aria-labelledby="delete-journal-title"><DialogTitle id="delete-journal-title">Delete journal?</DialogTitle><DialogContent>Only an empty journal can be deleted.</DialogContent><DialogActions><Button onClick={() => setDeleting(null)}>Cancel</Button><Button variant="contained" color="error" onClick={() => void remove()}>Delete</Button></DialogActions></Dialog>
  </div>;
}
