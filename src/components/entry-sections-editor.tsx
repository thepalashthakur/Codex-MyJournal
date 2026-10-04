"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import type { Emotion, EntrySection, ImpactArea, ImpactEntity } from "@/lib/emotional-context";
import { contextRequest } from "./context-api";
import { EmotionPicker, ImpactPicker } from "./section-context-pickers";

type Props = { entryId: string; initialSections: EntrySection[]; initialEmotions: Emotion[]; initialAreas: ImpactArea[]; initialEntities: ImpactEntity[]; recentIds: string[]; frequentIds: string[] };
type Action = { action: "setEmotion"; emotionId: string | null; intensity: number | null } | { action: "addArea" | "removeArea"; areaId: string } | { action: "addEntity" | "removeEntity"; areaId: string; entityId: string };

function SectionCard({ section, index, count, onMove, onDuplicate, onDelete, onEmotion, onImpact }: { section: EntrySection; index: number; count: number; onMove: (index: number, direction: -1 | 1) => Promise<void>; onDuplicate: (section: EntrySection) => Promise<void>; onDelete: (section: EntrySection) => void; onEmotion: () => void; onImpact: () => void }) {
  const [title, setTitle] = useState(section.title); const [status, setStatus] = useState("Saved");
  const revision = useRef(section.revision); const dirty = useRef(false); const saving = useRef(false); const conflict = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null); const flushRef = useRef<() => Promise<void>>(async () => {}); const persistRef = useRef<() => void>(() => {});
  const storageKey = `stillroom:section:${section.id}`;
  const schedule = useCallback(() => { dirty.current = true; persistRef.current(); setStatus(navigator.onLine ? "Saving…" : "Offline changes"); if (timer.current) clearTimeout(timer.current); if (!conflict.current) timer.current = setTimeout(() => void flushRef.current(), 900); }, []);
  const editor = useEditor({ extensions: [StarterKit], content: section.content, immediatelyRender: false, editorProps: { attributes: { class: "prose-editor section-prose", "aria-label": `Content for ${section.title || `section ${index + 1}`}` } }, onUpdate: () => schedule() });
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
  return <Paper component="section" variant="outlined" sx={{ p: { xs: 2, sm: 3 }, minWidth: 0 }} aria-label={title || `Section ${index + 1}`}><Stack spacing={2}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}><TextField label={`Section ${index + 1} title (optional)`} value={title} onChange={event => { setTitle(event.target.value); schedule(); }} slotProps={{ htmlInput: { maxLength: 200 } }} size="small" sx={{ flex: 1 }}/><Stack className="section-actions" direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: { xs: "space-between", sm: "flex-end" } }}><Typography variant="caption" color="text.secondary" role="status" sx={{ mr: 1 }}>{status}</Typography><Button size="small" aria-label={`Move section ${index + 1} up`} disabled={index === 0} onClick={() => void onMove(index, -1)}><ArrowUp size={17}/></Button><Button size="small" aria-label={`Move section ${index + 1} down`} disabled={index === count - 1} onClick={() => void onMove(index, 1)}><ArrowDown size={17}/></Button><Button size="small" aria-label={`Duplicate section ${index + 1}`} disabled={status !== "Saved"} onClick={() => void onDuplicate(section)}><Copy size={17}/></Button><Button size="small" color="error" aria-label={`Delete section ${index + 1}`} onClick={() => onDelete(section)}><Trash2 size={17}/></Button></Stack></Stack>
    <Box sx={{ minHeight: 120, p: 1.5, border: 1, borderColor: "divider", borderRadius: 2, "& .ProseMirror": { minHeight: 90, outline: "none" }, "&:focus-within": { borderColor: "primary.main", boxShadow: theme => `0 0 0 2px ${theme.palette.action.focus}` } }}><EditorContent editor={editor}/></Box>
    <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, alignItems: "center" }}><Button size="small" variant="outlined" onClick={onEmotion}>{section.emotion ? "Edit emotion" : "+ Emotion"}</Button><Button size="small" variant="outlined" onClick={onImpact}>{section.impacts.length ? "Edit impacts" : "+ Impact"}</Button>{section.emotion && <Chip size="small" label={`${section.emotion.emotion_name}${section.emotion.intensity ? ` · ${section.emotion.intensity}/10` : ""}`}/>}{section.impacts.map(area => <Chip key={area.id} size="small" label={`${area.area_name}${area.entities.length ? `: ${area.entities.map(entity => entity.entity_name).join(", ")}` : ""}`}/>)}</Stack>
  </Stack></Paper>;
}

export function EntrySectionsEditor({ entryId, initialSections, initialEmotions, initialAreas, initialEntities, recentIds, frequentIds }: Props) {
  const [sections, setSections] = useState(initialSections); const [emotions, setEmotions] = useState(initialEmotions);
  const [areas, setAreas] = useState(initialAreas); const [entities, setEntities] = useState(initialEntities);
  const [emotionFor, setEmotionFor] = useState<string | null>(null); const [impactFor, setImpactFor] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EntrySection | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const emotionSection = sections.find(item => item.id === emotionFor);
  const impactSection = sections.find(item => item.id === impactFor);
  async function reload() { const response = await fetch(`/api/entries/${entryId}/sections`); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not load sections."); setSections(result.data); }
  async function add(duplicateFrom?: string) { setBusy(true); setError(""); try { await contextRequest(`/api/entries/${entryId}/sections`, "POST", duplicateFrom ? { duplicateFrom } : {}); await reload(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not add section."); } finally { setBusy(false); } }
  async function move(index: number, direction: -1 | 1) { const ids = sections.map(item => item.id); [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]]; setBusy(true); setError(""); try { await contextRequest(`/api/entries/${entryId}/sections`, "PUT", { ids }); setSections(current => ids.map((sectionId, position) => ({ ...current.find(item => item.id === sectionId)!, position }))); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not reorder sections."); } finally { setBusy(false); } }
  async function remove() { if (!deleteTarget) return; setBusy(true); setError(""); try { await contextRequest(`/api/entries/${entryId}/sections/${deleteTarget.id}`, "DELETE"); localStorage.removeItem(`stillroom:section:${deleteTarget.id}`); setSections(current => current.filter(item => item.id !== deleteTarget.id)); setDeleteTarget(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete section."); } finally { setBusy(false); } }
  async function action(sectionId: string, body: Action) { const result = await contextRequest<{ data: EntrySection }>(`/api/entries/${entryId}/sections/${sectionId}/context`, "POST", body); if (result.data) setSections(current => current.map(item => item.id === sectionId ? result.data : item)); }
  async function createEmotion(name: string, parentId: string | null) { const item = await contextRequest<Emotion>("/api/context/emotions", "POST", { name, parentId }); setEmotions(current => [...current, item]); return item; }
  async function createArea(name: string) { const item = await contextRequest<ImpactArea>("/api/context/areas", "POST", { name }); setAreas(current => [...current, item]); return item; }
  async function createEntity(name: string, areaId: string) { const item = await contextRequest<ImpactEntity>("/api/context/entities", "POST", { name, areaId }); setEntities(current => [...current, item]); return item; }
  return <section className="entry-sections" aria-labelledby="entry-sections-title"><Stack spacing={2}>
    <Box><Typography id="entry-sections-title" variant="h2">Sections</Typography><Typography color="text.secondary">Add focused moments when one entry covers more than one part of your day. Your main writing above stays just as it is.</Typography></Box>
    {sections.map((section, index) => <SectionCard key={section.id} section={section} index={index} count={sections.length} onMove={move} onDuplicate={item => add(item.id)} onDelete={setDeleteTarget} onEmotion={() => setEmotionFor(section.id)} onImpact={() => setImpactFor(section.id)}/>)}
    <Button variant="outlined" startIcon={<Plus size={18}/>} disabled={busy || sections.length >= 100} onClick={() => void add()} sx={{ alignSelf: "flex-start" }}>Add section</Button>
    {error && <Typography color="error" role="alert">{error}</Typography>}
  </Stack>
    {emotionSection && <EmotionPicker open section={emotionSection} emotions={emotions} recentIds={recentIds} frequentIds={frequentIds} onClose={() => setEmotionFor(null)} onSave={(emotionId, intensity) => action(emotionSection.id, { action: "setEmotion", emotionId, intensity })} onCreate={createEmotion}/>}
    {impactSection && <ImpactPicker open section={impactSection} areas={areas} entities={entities} onClose={() => setImpactFor(null)} onAction={body => action(impactSection.id, body)} onCreateArea={createArea} onCreateEntity={createEntity}/>}
    <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} aria-labelledby="delete-section-title"><DialogTitle id="delete-section-title">Delete this section?</DialogTitle><DialogContent>The section and its emotional context will no longer appear in this entry.</DialogContent><DialogActions><Button onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="contained" color="error" disabled={busy} onClick={() => void remove()}>Delete section</Button></DialogActions></Dialog>
  </section>;
}
