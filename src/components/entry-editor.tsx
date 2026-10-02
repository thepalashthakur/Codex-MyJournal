"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Bold, Italic, List, ListOrdered, Quote, Heading2, Undo2, Redo2, CheckSquare, Minus, Link as LinkIcon, Strikethrough } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isoToZonedLocal, zonedLocalToIso } from "@/lib/zoned-time";

type Entry = { id: string; title: string; content: Record<string, unknown>; revision: number; entry_date: string; local_date: string; timezone: string; is_favorite: boolean; journal_id: string; entry_tags?: { tags: { name: string } | null }[] };
type Journal = { id: string; name: string };
type Draft = { id: string; revision: number; journalId: string; title: string; content: Record<string, unknown>; contentText: string; entryDate: string; localDate: string; timezone: string; isFavorite: boolean };
const extensions = [StarterKit, LinkExtension.configure({ openOnClick: false }), Placeholder.configure({ placeholder: "Start writing…" }), TaskList, TaskItem.configure({ nested: true })];
export function EntryEditor({ entry, journals }: { entry: Entry; journals: Journal[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(entry.title); const [journalId, setJournalId] = useState(entry.journal_id);
  const [timezone, setTimezone] = useState(entry.timezone);
  const [local, setLocal] = useState(() => isoToZonedLocal(entry.entry_date, entry.timezone));
  const [favorite, setFavorite] = useState(entry.is_favorite);
  const [tags, setTags] = useState((entry.entry_tags || []).map(item => item.tags?.name).filter(Boolean).join(", "));
  const [status, setStatus] = useState("Saved"); const [focus, setFocus] = useState(false);
  const revision = useRef(entry.revision); const saving = useRef(false); const dirty = useRef(false); const conflict = useRef(false); const timer = useRef<ReturnType<typeof setTimeout> | null>(null); const flushRef = useRef<() => Promise<void>>(async () => {}); const persistRef = useRef<() => void>(() => {});
  const storageKey = `stillroom:draft:${entry.id}`;
  const editor = useEditor({ extensions, content: entry.content, immediatelyRender: false, editorProps: { attributes: { class: "prose-editor", "aria-label": "Journal entry body" } }, onUpdate: () => schedule() });
  const schedule = useCallback(() => { dirty.current = true; persistRef.current(); setStatus(navigator.onLine ? "Saving…" : "Offline changes"); if (timer.current) clearTimeout(timer.current); if (!conflict.current) timer.current = setTimeout(() => void flushRef.current(), 900); }, []);
  persistRef.current = () => { if (!editor) return; try { const draft = { id: entry.id, revision: revision.current, journalId, title, content: editor.getJSON(), contentText: editor.getText(), entryDate: zonedLocalToIso(local, timezone), localDate: local.slice(0, 10), timezone, isFavorite: favorite }; localStorage.setItem(storageKey, JSON.stringify(draft)); } catch { /* Invalid date is shown by save status. */ } };
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
      if (!dirty.current) { localStorage.removeItem(storageKey); setStatus("Saved"); }
    } catch (error) { dirty.current = true; if (error instanceof Error && error.message.includes("changed elsewhere")) conflict.current = true; setStatus(conflict.current ? "Conflict — copy your text before refreshing" : navigator.onLine ? "Save failed — retrying" : "Offline changes"); }
    finally { saving.current = false; if (dirty.current && !conflict.current) timer.current = setTimeout(() => void flush(), 3000); }
  }, [editor, local, timezone, entry.id, journalId, title, favorite, storageKey]);
  flushRef.current = flush;
  useEffect(() => { if (!editor) return; if (dirty.current) { persistRef.current(); if (timer.current) clearTimeout(timer.current); if (!conflict.current) timer.current = setTimeout(() => void flush(), 900); } }, [editor, title, journalId, local, timezone, favorite, flush]);
  useEffect(() => { const saved = localStorage.getItem(storageKey); if (!saved || !editor) return; try { const draft = JSON.parse(saved) as Draft; if (draft.revision !== entry.revision) { setStatus("A local draft is available, but this entry changed elsewhere"); return; } setTitle(draft.title); setJournalId(draft.journalId); setTimezone(draft.timezone); setLocal(isoToZonedLocal(draft.entryDate, draft.timezone)); setFavorite(draft.isFavorite); editor.commands.setContent(draft.content); dirty.current = true; setStatus("Offline changes"); } catch { /* Keep server draft. */ } }, [editor, entry.revision, storageKey]);
  useEffect(() => { const online = () => { if (dirty.current) void flush(); }; window.addEventListener("online", online); return () => { window.removeEventListener("online", online); }; }, [flush]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  async function saveTags() { const names = tags.split(",").map(value => value.trim()).filter(Boolean); const response = await fetch(`/api/entries/${entry.id}/tags`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ names }) }); setStatus(response.ok ? "Tags saved" : "Could not save tags"); }
  async function trash() { if (!confirm("Move this entry to Trash?")) return; const response = await fetch(`/api/entries/${entry.id}`, { method: "DELETE" }); if (response.ok) router.push("/timeline"); }
  function tool(label: string, Icon: typeof Bold, command: () => void, active = false) { return <button type="button" title={label} aria-label={label} aria-pressed={active} className={`editor-tool ${active ? "active" : ""}`} onClick={command}><Icon size={17} /></button>; }
  return <main className={`page editor-page ${focus ? "focus-mode" : ""}`}><div className="editor-top"><a href="/timeline" className="muted">← Timeline</a><span role="status" className="save-status">{status}</span><button className="text-button" onClick={() => setFocus(!focus)}>{focus ? "Exit focus" : "Focus mode"}</button></div><div className="editor-main"><input className="title-input" aria-label="Entry title" placeholder="Give this day a title…" value={title} onChange={event => { setTitle(event.target.value); schedule(); }} /><div className="editor-meta"><label>When<input type="datetime-local" value={local} onChange={event => { setLocal(event.target.value); schedule(); }} /></label><label>Timezone<input value={timezone} onChange={event => { setTimezone(event.target.value); schedule(); }} list="timezones" /></label><datalist id="timezones"><option value="UTC" /><option value="Asia/Kolkata" /><option value="America/New_York" /><option value="Europe/London" /></datalist><label>Journal<select value={journalId} onChange={event => { setJournalId(event.target.value); schedule(); }}>{journals.map(journal => <option value={journal.id} key={journal.id}>{journal.name}</option>)}</select></label><button type="button" className={`favorite-button ${favorite ? "active" : ""}`} aria-label={favorite ? "Remove favorite" : "Mark favorite"} onClick={() => { setFavorite(!favorite); schedule(); }}>{favorite ? "★" : "☆"}</button></div><div className="editor-toolbar" role="toolbar" aria-label="Text formatting">{editor && <>{tool("Bold", Bold, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}{tool("Italic", Italic, () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}{tool("Strikethrough", Strikethrough, () => editor.chain().focus().toggleStrike().run(), editor.isActive("strike"))}{tool("Heading", Heading2, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}{tool("Bullet list", List, () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}{tool("Numbered list", ListOrdered, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}{tool("Checklist", CheckSquare, () => editor.chain().focus().toggleTaskList().run(), editor.isActive("taskList"))}{tool("Quote", Quote, () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"))}{tool("Separator", Minus, () => editor.chain().focus().setHorizontalRule().run())}{tool("Link", LinkIcon, () => { const href = prompt("Link URL"); if (href && /^https?:\/\//i.test(href)) editor.chain().focus().setLink({ href }).run(); })}{tool("Undo", Undo2, () => editor.chain().focus().undo().run())}{tool("Redo", Redo2, () => editor.chain().focus().redo().run())}</>}</div><EditorContent editor={editor} /><div className="editor-bottom"><label>Tags <small>Separate with commas</small><input value={tags} onChange={event => setTags(event.target.value)} onBlur={() => void saveTags()} placeholder="family, travel, gratitude" /></label><button type="button" className="text-button" onClick={() => void trash()}>Move to Trash</button></div></div></main>;
}
