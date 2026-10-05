"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ChevronDown, MoreHorizontal, Star } from "lucide-react";
import { RichContent } from "@/components/rich-content";
import { isoToZonedLocal, zonedLocalToIso } from "@/lib/zoned-time";

type Entry = {
  id: string; title: string; content: Record<string, unknown>; content_text: string;
  revision: number; entry_date: string; timezone: string; is_favorite: boolean;
  journal_id: string; created_at?: string; updated_at?: string;
  locations?: { place_name: string | null; latitude: number | null; longitude: number | null } | null;
};
type Journal = { id: string; name: string };
type Draft = { id: string; revision: number; journalId: string; title: string; content: Record<string, unknown>; contentText: string; entryDate: string; localDate: string; timezone: string; isFavorite: boolean };

function dateLabel(local: string, timezone: string) {
  try { return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: timezone }).format(new Date(zonedLocalToIso(local, timezone))); }
  catch { return "Edit date and time"; }
}

export function EntryEditor({ entry, journals }: { entry: Entry; journals: Journal[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(entry.title);
  const [journalId, setJournalId] = useState(entry.journal_id);
  const [timezone, setTimezone] = useState(entry.timezone);
  const [local, setLocal] = useState(() => isoToZonedLocal(entry.entry_date, entry.timezone));
  const [favorite, setFavorite] = useState(entry.is_favorite);
  const [status, setStatus] = useState("Saved");
  const [modifiedAt, setModifiedAt] = useState(entry.updated_at);
  const [focus, setFocus] = useState(false);
  const [dateAnchor, setDateAnchor] = useState<HTMLElement | null>(null);
  const [journalAnchor, setJournalAnchor] = useState<HTMLElement | null>(null);
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [legacyDraft, setLegacyDraft] = useState<Draft | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);
  const revision = useRef(entry.revision);
  const saving = useRef(false);
  const dirty = useRef(false);
  const conflict = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushRef = useRef<() => Promise<void>>(async () => {});
  const persistRef = useRef<() => void>(() => {});
  const storageKey = `stillroom:metadata:${entry.id}`;

  const schedule = useCallback(() => {
    dirty.current = true; persistRef.current();
    setStatus(navigator.onLine ? "Saving…" : "Offline changes");
    if (timer.current) clearTimeout(timer.current);
    if (!conflict.current) timer.current = setTimeout(() => void flushRef.current(), 900);
  }, []);

  const flush = useCallback(async () => {
    if (saving.current || !dirty.current || conflict.current) return;
    let entryDate: string;
    try { entryDate = zonedLocalToIso(local, timezone); }
    catch { setStatus("Check date or timezone"); return; }
    const draft: Draft = {
      id: entry.id, revision: revision.current, journalId, title,
      content: entry.content, contentText: entry.content_text,
      entryDate, localDate: local.slice(0, 10), timezone, isFavorite: favorite,
    };
    dirty.current = false; saving.current = true;
    localStorage.setItem(storageKey, JSON.stringify(draft));
    try {
      const response = await fetch(`/api/entries/${entry.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Save failed.");
      revision.current = result.revision;
      if (result.updatedAt) setModifiedAt(result.updatedAt);
      if (!dirty.current) { localStorage.removeItem(storageKey); setStatus("Saved"); }
    } catch (cause) {
      dirty.current = true;
      if (cause instanceof Error && cause.message.includes("changed elsewhere")) conflict.current = true;
      setStatus(conflict.current ? "Conflict — copy your changes before refreshing" : navigator.onLine ? "Save failed — retrying" : "Offline changes");
    } finally {
      saving.current = false;
      if (dirty.current && !conflict.current) timer.current = setTimeout(() => void flushRef.current(), 3000);
    }
  }, [entry.id, entry.content, entry.content_text, journalId, title, local, timezone, favorite, storageKey]);

  useEffect(() => {
    flushRef.current = flush;
    persistRef.current = () => {
      try { localStorage.setItem(storageKey, JSON.stringify({ id: entry.id, revision: revision.current, journalId, title, content: entry.content, contentText: entry.content_text, entryDate: zonedLocalToIso(local, timezone), localDate: local.slice(0, 10), timezone, isFavorite: favorite })); }
      catch { /* Invalid date is reported by the save status. */ }
    };
  }, [flush, storageKey, entry.id, entry.content, entry.content_text, journalId, title, local, timezone, favorite]);
  useEffect(() => {
    if (!dirty.current) return;
    persistRef.current(); if (timer.current) clearTimeout(timer.current);
    if (!conflict.current) timer.current = setTimeout(() => void flushRef.current(), 900);
  }, [title, journalId, local, timezone, favorite]);
  useEffect(() => {
    const task = setTimeout(() => {
      try {
        const old = localStorage.getItem(`stillroom:draft:${entry.id}`);
        if (old) { const draft = JSON.parse(old) as Draft; if (draft.contentText?.trim()) setLegacyDraft(draft); }
        const saved = localStorage.getItem(storageKey);
        if (!saved) return;
        const draft = JSON.parse(saved) as Draft;
        if (draft.revision !== entry.revision) { setStatus("A local metadata draft exists, but this entry changed elsewhere"); return; }
        setTitle(draft.title); setJournalId(draft.journalId); setTimezone(draft.timezone);
        setLocal(isoToZonedLocal(draft.entryDate, draft.timezone)); setFavorite(draft.isFavorite);
        dirty.current = true; setStatus("Offline changes");
      } catch { /* Keep the server copy. */ }
    }, 0);
    return () => clearTimeout(task);
  }, [entry.id, entry.revision, storageKey]);
  useEffect(() => { const online = () => { if (dirty.current) void flushRef.current(); }; window.addEventListener("online", online); return () => window.removeEventListener("online", online); }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { document.documentElement.classList.toggle("entry-focus", focus); return () => document.documentElement.classList.remove("entry-focus"); }, [focus]);

  async function trash() {
    const response = await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
    setTrashOpen(false);
    if (response.ok) router.push("/timeline"); else setStatus("Could not move entry to Trash");
  }

  return <div className={`entry-core ${focus ? "focus-mode" : ""}`}>
    <header className="editor-top">
      <a href="/timeline" className="editor-back">← Journal</a>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end", minWidth: 0 }}>
        <span role="status" className="save-status">{status}</span>
        {status.includes("failed") && <Button size="small" onClick={() => void flushRef.current()}>Retry</Button>}
        <Button size="small" onClick={() => setFocus(!focus)}>{focus ? "Exit focus" : "Focus"}</Button>
        {!focus && <IconButton aria-label="Entry actions" aria-haspopup="menu" onClick={event => setActionsAnchor(event.currentTarget)}><MoreHorizontal size={20}/></IconButton>}
      </Stack>
    </header>
    <div className="editor-main">
      {!focus && <div className="editor-meta">
        <Button className="editor-date" onClick={event => setDateAnchor(event.currentTarget)} aria-label={`Edit date and time: ${dateLabel(local, timezone)}`}>{dateLabel(local, timezone)}</Button>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <Button className="editor-journal" endIcon={<ChevronDown size={16}/>} onClick={event => setJournalAnchor(event.currentTarget)} aria-haspopup="menu">{journals.find(journal => journal.id === journalId)?.name || "Journal"}</Button>
          <IconButton aria-label={favorite ? "Remove from favorites" : "Add to favorites"} aria-pressed={favorite} color={favorite ? "primary" : "default"} onClick={() => { setFavorite(!favorite); schedule(); }}><Star size={21} fill={favorite ? "currentColor" : "none"}/></IconButton>
        </Stack>
      </div>}
      <input className="title-input" aria-label="Entry title" placeholder="Give this day a title…" value={title} onChange={event => { setTitle(event.target.value); schedule(); }}/>
      {legacyDraft && !focus && <Alert severity="info" sx={{ mt: 2 }} action={<Button color="inherit" onClick={() => setDraftOpen(true)}>View draft</Button>}>Earlier unsaved writing is available on this device.</Alert>}
    </div>
    <Popover open={Boolean(dateAnchor)} anchorEl={dateAnchor} onClose={() => setDateAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "left" }}><Stack spacing={2} sx={{ p: 2, width: { xs: 280, sm: 320 } }}><TextField label="Date and time" type="datetime-local" value={local} onChange={event => { setLocal(event.target.value); schedule(); }} slotProps={{ inputLabel: { shrink: true } }}/><Button onClick={() => setDateAnchor(null)}>Done</Button></Stack></Popover>
    <Menu anchorEl={journalAnchor} open={Boolean(journalAnchor)} onClose={() => setJournalAnchor(null)}>{journals.map(journal => <MenuItem key={journal.id} selected={journal.id === journalId} onClick={() => { setJournalId(journal.id); schedule(); setJournalAnchor(null); }}>{journal.name}</MenuItem>)}</Menu>
    <Menu anchorEl={actionsAnchor} open={Boolean(actionsAnchor)} onClose={() => setActionsAnchor(null)}><MenuItem onClick={() => { setDetailsOpen(true); setActionsAnchor(null); }}>Entry details</MenuItem><MenuItem sx={{ color: "error.main" }} onClick={() => { setTrashOpen(true); setActionsAnchor(null); }}>Move to Trash</MenuItem></Menu>
    <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} aria-labelledby="entry-details-title" fullWidth maxWidth="xs"><DialogTitle id="entry-details-title">Entry details</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      <Typography variant="body2">Journal: {journals.find(journal => journal.id === journalId)?.name || "Unknown"}</Typography>
      <Typography variant="body2">Timezone: {timezone}</Typography>
      {entry.locations?.place_name && <Typography variant="body2">Location: {entry.locations.place_name}</Typography>}
      {entry.locations && (entry.locations.latitude != null || entry.locations.longitude != null) && <Typography variant="body2">Coordinates: {[entry.locations.latitude, entry.locations.longitude].filter(value => value != null).join(", ")}</Typography>}
      <TextField label="Change timezone" value={timezone} onChange={event => { setTimezone(event.target.value); schedule(); }} slotProps={{ htmlInput: { list: "timezones" } }}/>
      <datalist id="timezones"><option value="UTC"/><option value="Asia/Kolkata"/><option value="America/New_York"/><option value="Europe/London"/></datalist>
      {entry.created_at && <Typography variant="body2">Created: {new Date(entry.created_at).toLocaleString()}</Typography>}
      {modifiedAt && <Typography variant="body2">Modified: {new Date(modifiedAt).toLocaleString()}</Typography>}
    </Stack></DialogContent><DialogActions><Button onClick={() => setDetailsOpen(false)}>Done</Button></DialogActions></Dialog>
    <Dialog open={draftOpen} onClose={() => setDraftOpen(false)} aria-labelledby="legacy-draft-title" fullWidth><DialogTitle id="legacy-draft-title">Earlier unsaved writing</DialogTitle><DialogContent><Typography color="text.secondary" sx={{ mb: 2 }}>Copy any text you want to keep into a section. This draft stays on this device.</Typography><div className="reader-body"><RichContent content={legacyDraft?.content}/></div></DialogContent><DialogActions><Button onClick={() => setDraftOpen(false)}>Done</Button></DialogActions></Dialog>
    <Dialog open={trashOpen} onClose={() => setTrashOpen(false)} aria-labelledby="trash-title"><DialogTitle id="trash-title">Move entry to Trash?</DialogTitle><DialogContent>You can restore it later from Settings.</DialogContent><DialogActions><Button onClick={() => setTrashOpen(false)}>Cancel</Button><Button variant="contained" color="error" onClick={() => void trash()}>Move to Trash</Button></DialogActions></Dialog>
  </div>;
}
