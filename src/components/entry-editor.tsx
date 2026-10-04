"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Bold, Italic, List, ListOrdered, Quote, Heading2, Undo2, Redo2, CheckSquare, Minus, Link as LinkIcon, Strikethrough, MoreHorizontal, Star, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isoToZonedLocal, zonedLocalToIso } from "@/lib/zoned-time";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { EntryTagPicker } from "@/components/entry-tag-picker";

type Entry = { id: string; title: string; content: Record<string, unknown>; revision: number; entry_date: string; local_date: string; timezone: string; is_favorite: boolean; journal_id: string; created_at?: string; updated_at?: string; locations?: { place_name: string | null; latitude: number | null; longitude: number | null } | null; entry_tags?: { tags: { name: string } | null }[] };
type Journal = { id: string; name: string };
type Draft = { id: string; revision: number; journalId: string; title: string; content: Record<string, unknown>; contentText: string; entryDate: string; localDate: string; timezone: string; isFavorite: boolean };
const extensions = [StarterKit.configure({ link: { openOnClick: false } }), Placeholder.configure({ placeholder: "Start writing…" }), TaskList, TaskItem.configure({ nested: true })];
function dateLabel(local: string, timezone: string) {
  try { return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: timezone }).format(new Date(zonedLocalToIso(local, timezone))); }
  catch { return "Edit date and time"; }
}
export function EntryEditor({ entry, journals, availableTags }: { entry: Entry; journals: Journal[]; availableTags: string[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(entry.title); const [journalId, setJournalId] = useState(entry.journal_id);
  const [timezone, setTimezone] = useState(entry.timezone);
  const [local, setLocal] = useState(() => isoToZonedLocal(entry.entry_date, entry.timezone));
  const [favorite, setFavorite] = useState(entry.is_favorite);
  const [status, setStatus] = useState("Saved"); const [focus, setFocus] = useState(false);
  const [modifiedAt, setModifiedAt] = useState(entry.updated_at);
  const [trashOpen, setTrashOpen] = useState(false); const [linkOpen, setLinkOpen] = useState(false); const [linkHref, setLinkHref] = useState("");
  const [dateAnchor, setDateAnchor] = useState<HTMLElement | null>(null); const [journalAnchor, setJournalAnchor] = useState<HTMLElement | null>(null);
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null); const [formatAnchor, setFormatAnchor] = useState<HTMLElement | null>(null); const [detailsOpen, setDetailsOpen] = useState(false);
  const revision = useRef(entry.revision); const saving = useRef(false); const dirty = useRef(false); const conflict = useRef(false); const timer = useRef<ReturnType<typeof setTimeout> | null>(null); const flushRef = useRef<() => Promise<void>>(async () => {}); const persistRef = useRef<() => void>(() => {});
  const storageKey = `stillroom:draft:${entry.id}`;
  const editor = useEditor({ extensions, content: entry.content, immediatelyRender: false, editorProps: { attributes: { class: "prose-editor", "aria-label": "Journal entry body" } }, onUpdate: () => schedule() });
  const schedule = useCallback(() => { dirty.current = true; persistRef.current(); setStatus(navigator.onLine ? "Saving…" : "Offline changes"); if (timer.current) clearTimeout(timer.current); if (!conflict.current) timer.current = setTimeout(() => void flushRef.current(), 900); }, []);
  const flush = useCallback(async () => {
    if (!editor || saving.current || !dirty.current || conflict.current) return;
    let date: string;
    try { date = zonedLocalToIso(local, timezone); } catch { setStatus("Check date or timezone"); return; }
    const draft: Draft = { id: entry.id, revision: revision.current, journalId, title, content: editor.getJSON() as Record<string, unknown>, contentText: editor.getText(), entryDate: date, localDate: local.slice(0, 10), timezone, isFavorite: favorite };
    dirty.current = false; saving.current = true;
    localStorage.setItem(storageKey, JSON.stringify(draft));
    try {
      const response = await fetch(`/api/entries/${entry.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Save failed.");
      revision.current = result.revision;
      if (result.updated_at) setModifiedAt(result.updated_at);
      if (!dirty.current) { localStorage.removeItem(storageKey); setStatus("Saved"); }
    } catch (error) { dirty.current = true; if (error instanceof Error && error.message.includes("changed elsewhere")) conflict.current = true; setStatus(conflict.current ? "Conflict — copy your text before refreshing" : navigator.onLine ? "Save failed — retrying" : "Offline changes"); }
    finally { saving.current = false; if (dirty.current && !conflict.current) timer.current = setTimeout(() => void flush(), 3000); }
  }, [editor, local, timezone, entry.id, journalId, title, favorite, storageKey]);
  useEffect(() => { persistRef.current = () => { if (!editor) return; try { const draft = { id: entry.id, revision: revision.current, journalId, title, content: editor.getJSON(), contentText: editor.getText(), entryDate: zonedLocalToIso(local, timezone), localDate: local.slice(0, 10), timezone, isFavorite: favorite }; localStorage.setItem(storageKey, JSON.stringify(draft)); } catch { /* Invalid date is shown by save status. */ } }; flushRef.current = flush; }, [editor, entry.id, journalId, title, local, timezone, favorite, storageKey, flush]);
  useEffect(() => { if (!editor) return; if (dirty.current) { persistRef.current(); if (timer.current) clearTimeout(timer.current); if (!conflict.current) timer.current = setTimeout(() => void flush(), 900); } }, [editor, title, journalId, local, timezone, favorite, flush]);
  useEffect(() => { const task = setTimeout(() => { const saved = localStorage.getItem(storageKey); if (!saved || !editor) return; try { const draft = JSON.parse(saved) as Draft; if (draft.revision !== entry.revision) { setStatus("A local draft is available, but this entry changed elsewhere"); return; } setTitle(draft.title); setJournalId(draft.journalId); setTimezone(draft.timezone); setLocal(isoToZonedLocal(draft.entryDate, draft.timezone)); setFavorite(draft.isFavorite); editor.commands.setContent(draft.content); dirty.current = true; setStatus("Offline changes"); } catch { /* Keep server draft. */ } }, 0); return () => clearTimeout(task); }, [editor, entry.revision, storageKey]);
  useEffect(() => { const online = () => { if (dirty.current) void flush(); }; window.addEventListener("online", online); return () => { window.removeEventListener("online", online); }; }, [flush]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { document.documentElement.classList.toggle("entry-focus", focus); return () => document.documentElement.classList.remove("entry-focus"); }, [focus]);
  async function trash() { const response = await fetch(`/api/entries/${entry.id}`, { method: "DELETE" }); setTrashOpen(false); if (response.ok) router.push("/timeline"); else setStatus("Could not move entry to Trash"); }
  function tool(label: string, Icon: typeof Bold, command: () => void, active = false) { return <IconButton type="button" title={label} aria-label={label} aria-pressed={active} className={`editor-tool ${active ? "active" : ""}`} onClick={command}><Icon size={17} /></IconButton>; }
  return <main className={`page editor-page ${focus ? "focus-mode" : ""}`}>
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
      {!focus && <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">{editor && <>
        {tool("Bold", Bold, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
        {tool("Italic", Italic, () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
        {tool("Heading", Heading2, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}
        {tool("Bullet list", List, () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
        {tool("Numbered list", ListOrdered, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
        {tool("Checklist", CheckSquare, () => editor.chain().focus().toggleTaskList().run(), editor.isActive("taskList"))}
        {tool("Quote", Quote, () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"))}
        {tool("Link", LinkIcon, () => { setLinkHref(""); setLinkOpen(true); })}
        <IconButton aria-label="More formatting" aria-haspopup="menu" onClick={event => setFormatAnchor(event.currentTarget)}><MoreHorizontal size={18}/></IconButton>
      </>}</div>}
      <EditorContent editor={editor}/>
      {!focus && <EntryTagPicker entryId={entry.id} initialTags={(entry.entry_tags || []).map(item => item.tags?.name).filter((name): name is string => Boolean(name))} availableTags={availableTags}/>}
    </div>
    <Popover open={Boolean(dateAnchor)} anchorEl={dateAnchor} onClose={() => setDateAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "left" }}><Stack spacing={2} sx={{ p: 2, width: { xs: 280, sm: 320 } }}><TextField label="Date and time" type="datetime-local" value={local} onChange={event => { setLocal(event.target.value); schedule(); }} slotProps={{ inputLabel: { shrink: true } }}/><Button onClick={() => setDateAnchor(null)}>Done</Button></Stack></Popover>
    <Menu anchorEl={journalAnchor} open={Boolean(journalAnchor)} onClose={() => setJournalAnchor(null)}>{journals.map(journal => <MenuItem key={journal.id} selected={journal.id === journalId} onClick={() => { setJournalId(journal.id); schedule(); setJournalAnchor(null); }}>{journal.name}</MenuItem>)}</Menu>
    <Menu anchorEl={formatAnchor} open={Boolean(formatAnchor)} onClose={() => setFormatAnchor(null)}><MenuItem onClick={() => { editor?.chain().focus().toggleStrike().run(); setFormatAnchor(null); }}><Strikethrough size={17}/> &nbsp; Strikethrough</MenuItem><MenuItem onClick={() => { editor?.chain().focus().setHorizontalRule().run(); setFormatAnchor(null); }}><Minus size={17}/> &nbsp; Separator</MenuItem><MenuItem onClick={() => { editor?.chain().focus().undo().run(); setFormatAnchor(null); }}><Undo2 size={17}/> &nbsp; Undo</MenuItem><MenuItem onClick={() => { editor?.chain().focus().redo().run(); setFormatAnchor(null); }}><Redo2 size={17}/> &nbsp; Redo</MenuItem></Menu>
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
    <Dialog open={linkOpen} onClose={() => setLinkOpen(false)} aria-labelledby="link-title"><DialogTitle id="link-title">Add link</DialogTitle><DialogContent sx={{ pt: 1 }}><TextField label="Link URL" type="url" value={linkHref} onChange={event => setLinkHref(event.target.value)} placeholder="https://example.com" fullWidth/></DialogContent><DialogActions><Button onClick={() => setLinkOpen(false)}>Cancel</Button><Button variant="contained" disabled={!/^https?:\/\//i.test(linkHref)} onClick={() => { if (editor) editor.chain().focus().setLink({ href: linkHref }).run(); setLinkOpen(false); }}>Add link</Button></DialogActions></Dialog>
    <Dialog open={trashOpen} onClose={() => setTrashOpen(false)} aria-labelledby="trash-title"><DialogTitle id="trash-title">Move entry to Trash?</DialogTitle><DialogContent>You can restore it later from Settings.</DialogContent><DialogActions><Button onClick={() => setTrashOpen(false)}>Cancel</Button><Button variant="contained" color="error" onClick={() => void trash()}>Move to Trash</Button></DialogActions></Dialog>
  </main>;
}
