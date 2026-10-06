"use client";

import { useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { Plus } from "lucide-react";

export function EntryTagPicker({ entryId, initialTags, availableTags, onTagsChanged }: { entryId: string; initialTags: string[]; availableTags: string[]; onTagsChanged?: (tags: string[]) => void }) {
  const compact = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [tags, setTags] = useState(initialTags);
  const [options, setOptions] = useState(availableTags);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function update(next: string[]) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/entries/${entryId}/tags`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ names: next }) });
      if (!response.ok) throw new Error();
      setTags(next);
      onTagsChanged?.(next);
      setOptions(current => Array.from(new Set([...current, ...next])).sort((a, b) => a.localeCompare(b)));
      setQuery(""); setOpen(false);
    } catch { setError("Couldn't save tags. Try again."); }
    finally { setBusy(false); }
  }

  const name = query.trim().replace(/^#/, "");
  const exists = tags.some(tag => tag.toLowerCase() === name.toLowerCase());
  return <section className="entry-tags" aria-label="Tags">
    <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
      {tags.map(tag => <Chip key={tag} label={`#${tag}`} onDelete={busy ? undefined : () => void update(tags.filter(item => item !== tag))} deleteIcon={undefined} variant="outlined" />)}
      <Button size="small" startIcon={<Plus size={16}/>} onClick={() => setOpen(true)}>Add tag</Button>
    </Stack>
    {error && <Typography color="error" role="alert" variant="body2">{error}</Typography>}
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs" fullScreen={compact} aria-labelledby="tag-picker-title">
      <DialogTitle id="tag-picker-title">Add a tag</DialogTitle>
      <DialogContent><Stack sx={{ pt: 2 }}>
        <Autocomplete freeSolo options={options.filter(tag => !tags.includes(tag))} inputValue={query} onInputChange={(_, value) => setQuery(value)} onChange={(_, value) => { if (typeof value === "string") setQuery(value); }} renderInput={params => <TextField {...params} label="Search or create a tag" autoFocus />} />
        {name && <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{exists ? "This entry already has that tag." : options.some(tag => tag.toLowerCase() === name.toLowerCase()) ? `Add #${name}` : `Create #${name}`}</Typography>}
        {error && <Typography color="error" role="alert" sx={{ mt: 1 }}>{error}</Typography>}
      </Stack></DialogContent>
      <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" disabled={!name || name.length > 60 || exists || busy || tags.length >= 20} onClick={() => void update([...tags, options.find(tag => tag.toLowerCase() === name.toLowerCase()) || name])}>{busy ? "Saving…" : "Add tag"}</Button></DialogActions>
    </Dialog>
  </section>;
}
