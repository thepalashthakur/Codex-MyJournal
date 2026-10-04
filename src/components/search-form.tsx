"use client";

import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { Emotion, ImpactArea, ImpactEntity } from "@/lib/emotional-context";

type SearchParams = { q?: string; journal?: string; tag?: string; favorites?: string; from?: string; to?: string; media?: string; emotion?: string; area?: string; entity?: string };
export function SearchForm({ params, journals, tags, emotions, areas, entities }: { params: SearchParams; journals: { id: string; name: string }[]; tags: { id: string; name: string }[]; emotions: Emotion[]; areas: ImpactArea[]; entities: ImpactEntity[] }) {
  return <Paper component="form" method="get" variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}><Stack spacing={2}>
    <TextField label="Search entries" type="search" name="q" defaultValue={params.q || ""} placeholder="A word, place, or memory…" slotProps={{ htmlInput: { maxLength: 200 } }} fullWidth/>
    <div className="search-filters">
      <TextField select label="Journal" name="journal" defaultValue={params.journal || ""}><MenuItem value="">All journals</MenuItem>{journals.map(j => <MenuItem value={j.id} key={j.id}>{j.name}</MenuItem>)}</TextField>
      <TextField select label="Tag" name="tag" defaultValue={params.tag || ""}><MenuItem value="">Any tag</MenuItem>{tags.map(tag => <MenuItem value={tag.id} key={tag.id}>{tag.name}</MenuItem>)}</TextField>
      <TextField select label="Media" name="media" defaultValue={params.media || ""}><MenuItem value="">Any media</MenuItem><MenuItem value="IMAGE">Photos</MenuItem><MenuItem value="VIDEO">Videos</MenuItem><MenuItem value="AUDIO">Audio</MenuItem></TextField>
      <TextField select label="Emotion" name="emotion" defaultValue={params.emotion || ""}><MenuItem value="">Any emotion</MenuItem>{emotions.map(emotion => <MenuItem value={emotion.id} key={emotion.id}>{emotion.name}{emotion.archived_at ? " (archived)" : ""}</MenuItem>)}</TextField>
      <TextField select label="Impact area" name="area" defaultValue={params.area || ""}><MenuItem value="">Any area</MenuItem>{areas.map(area => <MenuItem value={area.id} key={area.id}>{area.name}{area.archived_at ? " (archived)" : ""}</MenuItem>)}</TextField>
      <TextField select label="Impact entity" name="entity" defaultValue={params.entity || ""}><MenuItem value="">Any entity</MenuItem>{entities.map(entity => <MenuItem value={entity.id} key={entity.id}>{areas.find(area => area.id === entity.area_id)?.name} → {entity.name}</MenuItem>)}</TextField>
      <TextField label="From" type="date" name="from" defaultValue={params.from || ""} slotProps={{ inputLabel: { shrink: true } }}/>
      <TextField label="To" type="date" name="to" defaultValue={params.to || ""} slotProps={{ inputLabel: { shrink: true } }}/>
    </div>
    <FormControlLabel control={<Checkbox name="favorites" value="1" defaultChecked={params.favorites === "1"}/>} label="Favorites only"/>
    <Button variant="contained" type="submit" sx={{ alignSelf: "flex-start" }}>Search</Button>
  </Stack></Paper>;
}
