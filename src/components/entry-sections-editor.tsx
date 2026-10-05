"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ArrowDown, ArrowUp, Copy, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import type { Emotion, EntrySection, ImpactArea, ImpactEntity } from "@/lib/emotional-context";
import { contextRequest } from "./context-api";
import { EmotionPicker, ImpactPicker } from "./section-context-pickers";
import { SectionFormattingToolbar } from "./section-formatting-toolbar";

type Props = { entryId: string; initialSections: EntrySection[]; initialEmotions: Emotion[]; initialAreas: ImpactArea[]; initialEntities: ImpactEntity[]; recentIds: string[]; frequentIds: string[] };
type Action = { action: "setEmotion"; emotionId: string | null; intensity: number | null } | { action: "addArea" | "removeArea"; areaId: string } | { action: "addEntity" | "removeEntity"; areaId: string; entityId: string };

function SectionCard({ section, index, count, onMove, onDuplicate, onDelete, onEmotion, onImpact, onRegister, onActivate }: { section: EntrySection; index: number; count: number; onMove: (index: number, direction: -1 | 1) => Promise<void>; onDuplicate: (section: EntrySection) => Promise<void>; onDelete: (section: EntrySection) => void; onEmotion: () => void; onImpact: () => void; onRegister: (id: string, editor: Editor | null) => void; onActivate: (id: string, editor: Editor) => void }) {
  const [title, setTitle] = useState(section.title); const [status, setStatus] = useState("Saved");
  const [nameDraft, setNameDraft] = useState(section.title);
  const [nameOpen, setNameOpen] = useState(false);
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);
  const revision = useRef(section.revision); const dirty = useRef(false); const saving = useRef(false); const conflict = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null); const flushRef = useRef<() => Promise<void>>(async () => {}); const persistRef = useRef<() => void>(() => {});
  const storageKey = `stillroom:section:${section.id}`;
  const schedule = useCallback(() => { dirty.current = true; persistRef.current(); setStatus(navigator.onLine ? "Saving…" : "Offline changes"); if (timer.current) clearTimeout(timer.current); if (!conflict.current) timer.current = setTimeout(() => void flushRef.current(), 900); }, []);
  const editor = useEditor({ extensions: [StarterKit.configure({ link: { openOnClick: false } }), Placeholder.configure({ placeholder: "Start writing…" }), TaskList, TaskItem.configure({ nested: true })], content: section.content, immediatelyRender: false, editorProps: { attributes: { class: "prose-editor section-prose", "aria-label": `Writing for ${section.title || `section ${index + 1}`}` } }, onFocus: ({ editor: focused }) => onActivate(section.id, focused), onUpdate: () => schedule() });
  useEffect(() => { if (!editor) return; onRegister(section.id, editor); return () => onRegister(section.id, null); }, [editor, onRegister, section.id]);
  const flush = useCallback(async () => {
    if (!editor || saving.current || !dirty.current || conflict.current) return;
    const draft = { revision: revision.current, title, content: editor.getJSON(), contentText: editor.getText() };
    localStorage.setItem(storageKey, JSON.stringify(draft)); dirty.current = false; saving.current = true;
    try {
      const result = await contextRequest<{ revision: number }>(`/api/entries/${section.entry_id}/sections/${section.id}`, "PATCH", draft);
      revision.current = result.revision;
      if (!dirty.current) { localStorage.removeItem(storageKey); setStatus("Saved"); }
    } catch (cause) {
      dirty.current = true;
      if (cause instanceof Error && cause.message.includes("changed elsewhere")) conflict.current = true;
      setStatus(conflict.current ? "Conflict — copy this section before refreshing" : navigator.onLine ? "Save failed — retrying" : "Offline changes");
    } finally { saving.current = false; if (dirty.current && !conflict.current) timer.current = setTimeout(() => void flushRef.current(), 3000); }
  }, [editor, section.entry_id, section.id, storageKey, title]);
  useEffect(() => { flushRef.current = flush; persistRef.current = () => { if (editor) localStorage.setItem(storageKey, JSON.stringify({ revision: revision.current, title, content: editor.getJSON(), contentText: editor.getText() })); }; }, [flush, editor, storageKey, title]);
  useEffect(() => { if (dirty.current && !conflict.current) { persistRef.current(); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => void flushRef.current(), 900); } }, [title]);
  useEffect(() => { const task = setTimeout(() => { if (!editor) return; const saved = localStorage.getItem(storageKey); if (!saved) return; try { const draft = JSON.parse(saved) as { revision: number; title: string; content: Record<string, unknown> }; if (draft.revision !== revision.current) { setStatus("A local section draft exists, but this section changed elsewhere"); return; } setTitle(draft.title); editor.commands.setContent(draft.content); dirty.current = true; setStatus("Offline changes"); } catch { /* Keep the server copy. */ } }, 0); return () => clearTimeout(task); }, [editor, storageKey]);
  useEffect(() => { const online = () => { if (dirty.current) void flushRef.current(); }; window.addEventListener("online", online); return () => window.removeEventListener("online", online); }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function saveName() { if (nameDraft !== title) { setTitle(nameDraft); schedule(); } setNameOpen(false); }
  return <Box component="section" className="entry-section" aria-label={title || `Section ${index + 1}`}><Stack spacing={1.5}>
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
      <Typography component="h2" variant="subtitle2" color={title ? "text.primary" : "text.secondary"}>{title || `Section ${index + 1}`}</Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", ml: "auto" }}><Typography variant="caption" color="text.secondary" role="status">{status}</Typography><IconButton className="section-actions-button" aria-label={`Section ${index + 1} actions`} aria-haspopup="menu" onClick={event => setActionsAnchor(event.currentTarget)}><MoreHorizontal size={19}/></IconButton></Stack>
    </Stack>
    <Box className="section-writing"><EditorContent editor={editor}/></Box>
    <Stack className="section-context-actions" direction="row" sx={{ flexWrap: "wrap", gap: 1, alignItems: "center" }}>{section.emotion ? <Chip onClick={onEmotion} label={`${section.emotion.emotion_name}${section.emotion.intensity ? ` · ${section.emotion.intensity}/10` : ""}`} size="small" /> : <Button size="small" onClick={onEmotion}>+ Emotion</Button>}{section.impacts.length ? section.impacts.map(area => <Chip key={area.id} onClick={onImpact} size="small" label={`${area.area_name}${area.entities.length ? ` · ${area.entities.map(entity => entity.entity_name).join(", ")}` : ""}`}/>) : <Button size="small" onClick={onImpact}>+ Impact</Button>}</Stack>
  </Stack>
    <Menu anchorEl={actionsAnchor} open={Boolean(actionsAnchor)} onClose={() => setActionsAnchor(null)}>
      <MenuItem onClick={() => { setNameDraft(title); setNameOpen(true); setActionsAnchor(null); }}>{title ? "Rename section" : "Name section"}</MenuItem>
      <MenuItem disabled={index === 0} onClick={() => { void onMove(index, -1); setActionsAnchor(null); }}><ArrowUp size={17}/>&nbsp; Move up</MenuItem>
      <MenuItem disabled={index === count - 1} onClick={() => { void onMove(index, 1); setActionsAnchor(null); }}><ArrowDown size={17}/>&nbsp; Move down</MenuItem>
      <MenuItem disabled={status !== "Saved"} onClick={() => { void onDuplicate(section); setActionsAnchor(null); }}><Copy size={17}/>&nbsp; Duplicate</MenuItem>
      <MenuItem disabled={count === 1} sx={{ color: "error.main" }} onClick={() => { onDelete(section); setActionsAnchor(null); }}><Trash2 size={17}/>&nbsp; Delete</MenuItem>
    </Menu>
    <Dialog open={nameOpen} onClose={() => setNameOpen(false)} aria-labelledby={`section-name-${section.id}`} fullWidth maxWidth="xs">
      <DialogTitle id={`section-name-${section.id}`}>Name section</DialogTitle>
      <DialogContent><TextField label="Section name" value={nameDraft} onChange={event => setNameDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter") saveName(); }} slotProps={{ htmlInput: { maxLength: 200 } }} fullWidth sx={{ mt: 1 }}/></DialogContent>
      <DialogActions><Button onClick={() => setNameOpen(false)}>Cancel</Button><Button variant="contained" onClick={saveName}>Save</Button></DialogActions>
    </Dialog>
  </Box>;
}

export function EntrySectionsEditor({ entryId, initialSections, initialEmotions, initialAreas, initialEntities, recentIds, frequentIds }: Props) {
  const [sections, setSections] = useState(initialSections); const [emotions, setEmotions] = useState(initialEmotions);
  const [areas, setAreas] = useState(initialAreas); const [entities, setEntities] = useState(initialEntities);
  const [emotionFor, setEmotionFor] = useState<string | null>(null); const [impactFor, setImpactFor] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EntrySection | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const activeId = useRef<string | null>(initialSections[0]?.id || null);
  const editors = useRef(new Map<string, Editor>());
  const [activeSectionId, setActiveSectionId] = useState<string | null>(initialSections[0]?.id || null);
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const registerEditor = useCallback((id: string, editor: Editor | null) => {
    if (editor) editors.current.set(id, editor); else editors.current.delete(id);
    if (activeId.current === id) setActiveEditor(editor);
  }, []);
  const activateEditor = useCallback((id: string, editor: Editor) => {
    activeId.current = id; setActiveSectionId(id); setActiveEditor(editor);
  }, []);
  const emotionSection = sections.find(item => item.id === emotionFor);
  const impactSection = sections.find(item => item.id === impactFor);
  async function reload() { const response = await fetch(`/api/entries/${entryId}/sections`); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not load sections."); setSections(result.data); }
  async function add(duplicateFrom?: string) { setBusy(true); setError(""); try { const created = await contextRequest<{ id: string }>(`/api/entries/${entryId}/sections`, "POST", duplicateFrom ? { duplicateFrom } : {}); if (!activeId.current) { activeId.current = created.id; setActiveSectionId(created.id); } await reload(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not add section."); } finally { setBusy(false); } }
  async function move(index: number, direction: -1 | 1) { const ids = sections.map(item => item.id); [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]]; setBusy(true); setError(""); try { await contextRequest(`/api/entries/${entryId}/sections`, "PUT", { ids }); setSections(current => ids.map((sectionId, position) => ({ ...current.find(item => item.id === sectionId)!, position }))); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not reorder sections."); } finally { setBusy(false); } }
  async function remove() { if (!deleteTarget) return; setBusy(true); setError(""); try { await contextRequest(`/api/entries/${entryId}/sections/${deleteTarget.id}`, "DELETE"); localStorage.removeItem(`stillroom:section:${deleteTarget.id}`); const remaining = sections.filter(item => item.id !== deleteTarget.id); setSections(remaining); if (activeId.current === deleteTarget.id) { const nextId = remaining[0]?.id || null; activeId.current = nextId; setActiveSectionId(nextId); setActiveEditor(nextId ? editors.current.get(nextId) || null : null); } setDeleteTarget(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete section."); } finally { setBusy(false); } }
  async function action(sectionId: string, body: Action) { const result = await contextRequest<{ data: EntrySection }>(`/api/entries/${entryId}/sections/${sectionId}/context`, "POST", body); if (result.data) setSections(current => current.map(item => item.id === sectionId ? result.data : item)); }
  async function createEmotion(name: string, parentId: string | null) { const item = await contextRequest<Emotion>("/api/context/emotions", "POST", { name, parentId }); setEmotions(current => [...current, item]); return item; }
  async function createArea(name: string) { const item = await contextRequest<ImpactArea>("/api/context/areas", "POST", { name }); setAreas(current => [...current, item]); return item; }
  async function createEntity(name: string, areaId: string) { const item = await contextRequest<ImpactEntity>("/api/context/entities", "POST", { name, areaId }); setEntities(current => [...current, item]); return item; }
  const activeSection = sections.find(section => section.id === activeSectionId);
  const activeLabel = activeSection?.title || `Section ${Math.max(1, sections.findIndex(section => section.id === activeSectionId) + 1)}`;
  return <section className="entry-sections" aria-label="Entry sections"><Stack spacing={2}>
    <SectionFormattingToolbar editor={activeEditor} label={activeLabel}/>
    {sections.map((section, index) => <SectionCard key={section.id} section={section} index={index} count={sections.length} onMove={move} onDuplicate={item => add(item.id)} onDelete={setDeleteTarget} onEmotion={() => setEmotionFor(section.id)} onImpact={() => setImpactFor(section.id)} onRegister={registerEditor} onActivate={activateEditor}/>)}
    <Button className="add-section-button" variant="text" startIcon={<Plus size={18}/>} disabled={busy || sections.length >= 100} onClick={() => void add()} sx={{ alignSelf: "flex-start" }}>Add section</Button>
    {error && <Typography color="error" role="alert">{error}</Typography>}
  </Stack>
    {emotionSection && <EmotionPicker open section={emotionSection} emotions={emotions} recentIds={recentIds} frequentIds={frequentIds} onClose={() => setEmotionFor(null)} onSave={(emotionId, intensity) => action(emotionSection.id, { action: "setEmotion", emotionId, intensity })} onCreate={createEmotion}/>}
    {impactSection && <ImpactPicker open section={impactSection} areas={areas} entities={entities} onClose={() => setImpactFor(null)} onAction={body => action(impactSection.id, body)} onCreateArea={createArea} onCreateEntity={createEntity}/>}
    <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} aria-labelledby="delete-section-title"><DialogTitle id="delete-section-title">Delete this section?</DialogTitle><DialogContent>The section and its emotional context will no longer appear in this entry.</DialogContent><DialogActions><Button onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="contained" color="error" disabled={busy} onClick={() => void remove()}>Delete section</Button></DialogActions></Dialog>
  </section>;
}
