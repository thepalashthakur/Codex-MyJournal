"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import type { Emotion, EntrySection, ImpactArea, ImpactEntity } from "@/lib/emotional-context";

type EmotionPickerProps = {
  open: boolean; section: EntrySection; emotions: Emotion[]; recentIds: string[]; frequentIds: string[];
  onClose: () => void; onSave: (emotionId: string | null, intensity: number | null) => Promise<void>;
  onCreate: (name: string, parentId: string | null) => Promise<Emotion>;
};

function emotionPath(emotion: Emotion, byId: Map<string, Emotion>) {
  const names = [emotion.name]; let parent = emotion.parent_id;
  while (parent) { const item = byId.get(parent); if (!item) break; names.unshift(item.name); parent = item.parent_id; }
  return names.join(" → ");
}

export function EmotionPicker({ open, section, emotions, recentIds, frequentIds, onClose, onSave, onCreate }: EmotionPickerProps) {
  const compact = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [selected, setSelected] = useState<string | null>(section.emotion?.emotion_id || null);
  const [intensity, setIntensity] = useState<number | null>(section.emotion?.intensity ?? null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [query, setQuery] = useState(""); const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const active = emotions.filter(item => !item.archived_at && !item.deleted_at && !item.is_hidden);
  const byId = useMemo(() => new Map(emotions.map(item => [item.id, item])), [emotions]);
  const children = active.filter(item => item.parent_id === parentId);
  const matches = query.trim() ? active.filter(item => emotionPath(item, byId).toLowerCase().includes(query.trim().toLowerCase())) : [];
  const suggestions = (ids: string[]) => ids.map(id => byId.get(id)).filter((item): item is Emotion => Boolean(item && !item.archived_at && !item.deleted_at && !item.is_hidden));
  async function save() { setBusy(true); setError(""); try { await onSave(selected, selected ? intensity : null); onClose(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save emotion."); } finally { setBusy(false); } }
  async function create() { const name = (newName || query).trim(); if (!name) return; setBusy(true); setError(""); try { const item = await onCreate(name, parentId); setSelected(item.id); setQuery(""); setNewName(""); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create emotion."); } finally { setBusy(false); } }
  const itemRow = (item: Emotion) => <Stack key={item.id} direction="row" spacing={1} sx={{ alignItems: "center", minHeight: 48 }}><Button onClick={() => setSelected(item.id)} variant={selected === item.id ? "contained" : "text"} sx={{ flex: 1, justifyContent: "flex-start", textTransform: "none", minHeight: 44 }}><Box sx={{ width: 12, height: 12, mr: 1.5, borderRadius: "50%", bgcolor: item.color, border: 1, borderColor: "divider", flex: "none" }}/>{query ? emotionPath(item, byId) : item.name}</Button>{active.some(child => child.parent_id === item.id) && !query && <Button onClick={() => setParentId(item.id)} aria-label={`Browse ${item.name} emotions`}>Browse</Button>}</Stack>;
  return <Dialog className="context-picker" open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={compact} aria-labelledby="emotion-picker-title"><DialogTitle id="emotion-picker-title">Choose an emotion</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
    <TextField label="Search emotions" value={query} onChange={event => setQuery(event.target.value)} autoFocus fullWidth/>
    {!query && !parentId && (recentIds.length > 0 || frequentIds.length > 0) && <Stack spacing={1}>{recentIds.length > 0 && <><Typography variant="subtitle2">Recent</Typography><Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>{suggestions(recentIds).map(item => <Chip key={item.id} label={item.name} onClick={() => setSelected(item.id)} color={selected === item.id ? "primary" : "default"}/>)}</Stack></>}{frequentIds.length > 0 && <><Typography variant="subtitle2">Frequently used</Typography><Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>{suggestions(frequentIds).map(item => <Chip key={item.id} label={item.name} onClick={() => setSelected(item.id)} color={selected === item.id ? "primary" : "default"}/>)}</Stack></>}</Stack>}
    {!query && parentId && <Button onClick={() => setParentId(byId.get(parentId)?.parent_id || null)} sx={{ alignSelf: "flex-start" }}>← Back to {byId.get(parentId)?.parent_id ? byId.get(byId.get(parentId)?.parent_id || "")?.name : "all emotions"}</Button>}
    <Typography variant="subtitle2">{query ? "Search results" : parentId ? `${emotionPath(byId.get(parentId)!, byId)} · choose or browse` : "Browse the emotion wheel"}</Typography>
    <Box sx={{ maxHeight: compact ? "40vh" : 250, overflowY: "auto" }}>{(query ? matches : children).length ? (query ? matches : children).map(itemRow) : <Typography color="text.secondary">No emotions found. You can create one below.</Typography>}</Box>
    <Divider/>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}><TextField label={parentId ? `New emotion under ${byId.get(parentId)?.name}` : "New emotion"} value={newName} onChange={event => setNewName(event.target.value)} placeholder={query || "e.g. Hopeful"} fullWidth/><Button variant="outlined" disabled={busy || !(newName || query).trim()} onClick={() => void create()}>Create</Button></Stack>
    {selected && <Stack spacing={1}><Typography variant="subtitle2">{byId.get(selected)?.name || section.emotion?.emotion_name} · intensity (optional)</Typography><Slider value={intensity ?? 5} onChange={(_, value) => setIntensity(value as number)} min={1} max={10} step={1} marks valueLabelDisplay="auto" aria-label="Emotion intensity from 1 to 10"/><Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography variant="caption">1 · very mild</Typography><Button size="small" onClick={() => setIntensity(null)}>Clear intensity</Button><Typography variant="caption">10 · very strong</Typography></Stack></Stack>}
    {section.emotion && <Button color="error" onClick={() => { setSelected(null); setIntensity(null); }} sx={{ alignSelf: "flex-start" }}>Clear selected emotion</Button>}
    {error && <Typography color="error" role="alert">{error}</Typography>}
  </Stack></DialogContent><DialogActions sx={{ p: 2, gap: 1, "& .MuiButton-root": { minHeight: 44, m: 0 } }}><Button onClick={onClose}>Cancel</Button><Button variant="contained" disabled={busy} onClick={() => void save()}>Save emotion</Button></DialogActions></Dialog>;
}

type ImpactPickerProps = {
  open: boolean; section: EntrySection; areas: ImpactArea[]; entities: ImpactEntity[]; onClose: () => void;
  onAction: (action: { action: "addArea" | "removeArea"; areaId: string } | { action: "addEntity" | "removeEntity"; areaId: string; entityId: string }) => Promise<void>;
  onCreateArea: (name: string) => Promise<ImpactArea>;
  onCreateEntity: (name: string, areaId: string) => Promise<ImpactEntity>;
};
export function ImpactPicker({ open, section, areas, entities, onClose, onAction, onCreateArea, onCreateEntity }: ImpactPickerProps) {
  const compact = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [query, setQuery] = useState(""); const [areaName, setAreaName] = useState("");
  const [entityNames, setEntityNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const activeAreas = areas.filter(item => !item.archived_at);
  const visible = activeAreas.filter(area => !query.trim() || area.name.toLowerCase().includes(query.trim().toLowerCase()) || entities.some(entity => entity.area_id === area.id && !entity.archived_at && entity.name.toLowerCase().includes(query.trim().toLowerCase())));
  async function act(action: Parameters<typeof onAction>[0]) { setBusy(true); setError(""); try { if (action.action === "addEntity" && !section.impacts.some(item => item.area_id === action.areaId)) await onAction({ action: "addArea", areaId: action.areaId }); await onAction(action); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update impact."); } finally { setBusy(false); } }
  async function createArea() { const name = (areaName || query).trim(); if (!name) return; setBusy(true); setError(""); try { const area = await onCreateArea(name); await onAction({ action: "addArea", areaId: area.id }); setAreaName(""); setQuery(""); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create impact area."); } finally { setBusy(false); } }
  async function createEntity(areaId: string) { const name = entityNames[areaId]?.trim() || query.trim(); if (!name) return; setBusy(true); setError(""); try { const entity = await onCreateEntity(name, areaId); if (!section.impacts.some(item => item.area_id === areaId)) await onAction({ action: "addArea", areaId }); await onAction({ action: "addEntity", areaId, entityId: entity.id }); setEntityNames(current => ({ ...current, [areaId]: "" })); setQuery(""); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create entity."); } finally { setBusy(false); } }
  return <Dialog className="context-picker" open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={compact} aria-labelledby="impact-picker-title"><DialogTitle id="impact-picker-title">What influenced this section?</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}><TextField label="Search areas and entities" value={query} onChange={event => setQuery(event.target.value)} autoFocus fullWidth/>
    <Box sx={{ maxHeight: compact ? "58vh" : 380, overflowY: "auto" }}><Stack spacing={2}>{visible.map(area => { const selected = section.impacts.find(item => item.area_id === area.id); const matchingEntities = entities.filter(entity => entity.area_id === area.id && !entity.archived_at && (!query.trim() || entity.name.toLowerCase().includes(query.trim().toLowerCase()) || area.name.toLowerCase().includes(query.trim().toLowerCase()))); return <Box key={area.id} sx={{ borderBottom: 1, borderColor: "divider", pb: 2 }}><FormControlLabel control={<Checkbox checked={Boolean(selected)} disabled={busy} onChange={() => void act({ action: selected ? "removeArea" : "addArea", areaId: area.id })}/>} label={<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: area.color, border: 1, borderColor: "divider" }}/><span>{area.name}</span></Stack>}/>
      {(selected || query) && <Box sx={{ pl: { xs: 2, sm: 4 } }}><Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>{matchingEntities.map(entity => <Chip key={entity.id} label={entity.name} variant={selected?.entities.some(item => item.entity_id === entity.id) ? "filled" : "outlined"} color={selected?.entities.some(item => item.entity_id === entity.id) ? "primary" : "default"} disabled={busy} onClick={() => void act({ action: selected?.entities.some(item => item.entity_id === entity.id) ? "removeEntity" : "addEntity", areaId: area.id, entityId: entity.id })}/>)}</Stack><Stack direction="row" spacing={1} sx={{ mt: 1 }}><TextField size="small" label={`Add to ${area.name}`} value={entityNames[area.id] || ""} onChange={event => setEntityNames(current => ({ ...current, [area.id]: event.target.value }))} fullWidth/><Button disabled={busy || !(entityNames[area.id]?.trim() || query.trim())} onClick={() => void createEntity(area.id)}>Add</Button></Stack></Box>}
    </Box>; })}{visible.length === 0 && <Typography color="text.secondary">No matching areas or entities.</Typography>}</Stack></Box>
    <Divider/><Stack direction={{ xs: "column", sm: "row" }} spacing={1}><TextField label="New impact area" value={areaName} onChange={event => setAreaName(event.target.value)} placeholder={query || "e.g. Spirituality"} fullWidth/><Button variant="outlined" disabled={busy || !(areaName || query).trim()} onClick={() => void createArea()}>Create area</Button></Stack>
    {error && <Typography color="error" role="alert">{error}</Typography>}
  </Stack></DialogContent><DialogActions><Button onClick={onClose}>Done</Button></DialogActions></Dialog>;
}
