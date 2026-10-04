"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import type { Emotion } from "@/lib/emotional-context";
import { contextRequest } from "./context-api";

type Draft = { id?: string; name: string; color: string; parentId: string | null };

export function EmotionManager({ initialEmotions }: { initialEmotions: Emotion[] }) {
  const compact = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [emotions, setEmotions] = useState(initialEmotions);
  const [draft, setDraft] = useState<Draft | null>(null); const [pendingDelete, setPendingDelete] = useState<Emotion | null>(null);
  const [resetOpen, setResetOpen] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function reload() { const response = await fetch("/api/context/emotions"); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not load emotions."); setEmotions(result.data); }
  async function run(task: () => Promise<unknown>) { setBusy(true); setError(""); try { await task(); await reload(); return true; } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save emotion."); return false; } finally { setBusy(false); } }
  function openCreate(parentId: string | null = null) { setDraft({ name: "", color: parentId ? emotions.find(item => item.id === parentId)?.color || "#7A8291" : "#7A8291", parentId }); }
  async function saveDraft() { if (!draft) return; const value = { name: draft.name.trim(), color: draft.color, parentId: draft.parentId }; if (!value.name) return; if (await run(() => draft.id ? contextRequest(`/api/context/emotions/${draft.id}`, "PATCH", value) : contextRequest("/api/context/emotions", "POST", value))) setDraft(null); }
  async function move(item: Emotion, direction: -1 | 1) { const siblings = emotions.filter(entry => entry.parent_id === item.parent_id && !entry.archived_at).sort((a, b) => a.position - b.position || a.name.localeCompare(b.name)); const index = siblings.findIndex(entry => entry.id === item.id); const next = index + direction; if (next < 0 || next >= siblings.length) return; [siblings[index], siblings[next]] = [siblings[next], siblings[index]]; await run(async () => { for (const [position, sibling] of siblings.entries()) await contextRequest(`/api/context/emotions/${sibling.id}`, "PATCH", { position }); }); }
  const byId = new Map(emotions.map(item => [item.id, item]));
  const rows: { item: Emotion; level: number }[] = [];
  function visit(parentId: string | null, level: number) { for (const item of emotions.filter(entry => entry.parent_id === parentId).sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))) { rows.push({ item, level }); if (level < 3) visit(item.id, level + 1); } }
  visit(null, 1);
  return <Stack className="context-manager" spacing={2}>
    <Typography color="text.secondary">Choose from default emotions or make your own. Hide removes an emotion from quick selection; archive retires it. Existing section labels stay readable after changes.</Typography>
    <Button variant="contained" sx={{ alignSelf: "flex-start" }} onClick={() => openCreate()}>Create emotion</Button>
    {error && <Alert severity="error" role="alert">{error}</Alert>}
    <Stack spacing={1}>{rows.map(({ item, level }) => <Paper key={item.id} variant="outlined" sx={{ p: 1.5, ml: { xs: 0, sm: (level - 1) * 3 } }}><Stack direction={{ xs: "column", md: "row" }} sx={{ alignItems: { md: "center" }, justifyContent: "space-between", gap: 1 }}><Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}><Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: item.color, border: 1, borderColor: "divider", flex: "none" }}/><Typography sx={{ overflowWrap: "anywhere" }}>{level > 1 ? "↳ " : ""}{item.name}</Typography>{item.is_system && <Chip label="Default" size="small"/>}{item.is_hidden && <Chip label="Hidden" size="small"/>}{item.archived_at && <Chip label="Archived" size="small"/>}</Stack><Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}><Button size="small" disabled={busy} onClick={() => setDraft({ id: item.id, name: item.name, color: item.color, parentId: item.parent_id })}>Edit</Button><Button size="small" disabled={busy || level >= 3 || Boolean(item.archived_at)} onClick={() => openCreate(item.id)}>Add child</Button><Button size="small" disabled={busy} aria-label={`Move ${item.name} up`} onClick={() => void move(item, -1)}>↑</Button><Button size="small" disabled={busy} aria-label={`Move ${item.name} down`} onClick={() => void move(item, 1)}>↓</Button><Button size="small" disabled={busy} onClick={() => void run(() => contextRequest(`/api/context/emotions/${item.id}`, "PATCH", { hidden: !item.is_hidden }))}>{item.is_hidden ? "Unhide" : "Hide"}</Button><Button size="small" disabled={busy} onClick={() => void run(() => contextRequest(`/api/context/emotions/${item.id}`, "PATCH", { archived: !item.archived_at }))}>{item.archived_at ? "Restore" : "Archive"}</Button>{!item.is_system && <Button size="small" color="error" disabled={busy} onClick={() => setPendingDelete(item)}>Delete</Button>}</Stack></Stack></Paper>)}</Stack>
    <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={1}><Typography variant="h2">Reset to defaults</Typography><Typography color="text.secondary">Current emotions will be archived and a fresh default wheel will be added. Historical entries keep their saved emotion names and intensity.</Typography><Button variant="outlined" color="error" sx={{ alignSelf: "flex-start" }} onClick={() => setResetOpen(true)}>Reset emotions</Button></Stack></Paper>
    <Dialog open={Boolean(draft)} onClose={() => setDraft(null)} fullScreen={compact} fullWidth maxWidth="sm" aria-labelledby="emotion-edit-title"><DialogTitle id="emotion-edit-title">{draft?.id ? "Edit emotion" : "Create emotion"}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}><TextField label="Name" value={draft?.name || ""} onChange={event => setDraft(current => current && { ...current, name: event.target.value })} slotProps={{ htmlInput: { maxLength: 80 } }} required fullWidth/><TextField select label="Parent emotion" value={draft?.parentId || ""} onChange={event => setDraft(current => current && { ...current, parentId: event.target.value || null })} fullWidth><MenuItem value="">Top level</MenuItem>{emotions.filter(item => !item.archived_at && item.id !== draft?.id).map(item => <MenuItem key={item.id} value={item.id}>{item.parent_id ? `${byId.get(item.parent_id)?.name || "Parent"} → ` : ""}{item.name}</MenuItem>)}</TextField><label>Color <input type="color" value={draft?.color || "#7A8291"} onChange={event => setDraft(current => current && { ...current, color: event.target.value })}/></label>{error && <Alert severity="error" role="alert">{error}</Alert>}</Stack></DialogContent><DialogActions><Button onClick={() => setDraft(null)}>Cancel</Button><Button variant="contained" disabled={busy || !draft?.name.trim()} onClick={() => void saveDraft()}>Save</Button></DialogActions></Dialog>
    <Dialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)} aria-labelledby="emotion-delete-title"><DialogTitle id="emotion-delete-title">Delete {pendingDelete?.name}?</DialogTitle><DialogContent>If it is used in an entry or has child emotions, it will be archived to preserve history.</DialogContent><DialogActions><Button onClick={() => setPendingDelete(null)}>Cancel</Button><Button color="error" variant="contained" disabled={busy} onClick={() => void run(async () => { await contextRequest(`/api/context/emotions/${pendingDelete?.id}`, "DELETE"); setPendingDelete(null); })}>Delete or archive</Button></DialogActions></Dialog>
    <Dialog open={resetOpen} onClose={() => setResetOpen(false)} aria-labelledby="emotion-reset-title"><DialogTitle id="emotion-reset-title">Reset your emotion library?</DialogTitle><DialogContent>Your current library will be archived and new defaults added. Existing journal sections keep their saved context.</DialogContent><DialogActions><Button onClick={() => setResetOpen(false)}>Cancel</Button><Button color="error" variant="contained" disabled={busy} onClick={() => void run(async () => { await contextRequest("/api/context/emotions/reset", "POST"); setResetOpen(false); })}>Reset to defaults</Button></DialogActions></Dialog>
  </Stack>;
}
