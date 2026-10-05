"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { Bold, CheckSquare, Heading2, Italic, Link as LinkIcon, List, ListOrdered, Minus, MoreHorizontal, Quote, Redo2, Strikethrough, Undo2 } from "lucide-react";

export function SectionFormattingToolbar({ editor, label }: { editor: Editor | null; label: string }) {
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkHref, setLinkHref] = useState("");
  if (!editor) return null;
  function tool(name: string, Icon: typeof Bold, command: () => void, active = false) {
    return <IconButton key={name} type="button" title={name} aria-label={name} aria-pressed={active} className={`editor-tool ${active ? "active" : ""}`} onClick={command}><Icon size={17}/></IconButton>;
  }
  return <>
    <div className="editor-toolbar section-toolbar" role="toolbar" aria-label={`${label} formatting`}>
      {tool("Bold", Bold, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
      {tool("Italic", Italic, () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
      {tool("Heading", Heading2, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading"))}
      {tool("Bullet list", List, () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
      {tool("Numbered list", ListOrdered, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
      {tool("Checklist", CheckSquare, () => editor.chain().focus().toggleTaskList().run(), editor.isActive("taskList"))}
      {tool("Quote", Quote, () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"))}
      {tool("Link", LinkIcon, () => { setLinkHref(""); setLinkOpen(true); })}
      <IconButton aria-label="More formatting" aria-haspopup="menu" onClick={event => setMoreAnchor(event.currentTarget)}><MoreHorizontal size={18}/></IconButton>
    </div>
    <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)}>
      <MenuItem onClick={() => { editor.chain().focus().toggleStrike().run(); setMoreAnchor(null); }}><Strikethrough size={17}/>&nbsp; Strikethrough</MenuItem>
      <MenuItem onClick={() => { editor.chain().focus().setHorizontalRule().run(); setMoreAnchor(null); }}><Minus size={17}/>&nbsp; Separator</MenuItem>
      <MenuItem onClick={() => { editor.chain().focus().undo().run(); setMoreAnchor(null); }}><Undo2 size={17}/>&nbsp; Undo</MenuItem>
      <MenuItem onClick={() => { editor.chain().focus().redo().run(); setMoreAnchor(null); }}><Redo2 size={17}/>&nbsp; Redo</MenuItem>
    </Menu>
    <Dialog open={linkOpen} onClose={() => setLinkOpen(false)} aria-labelledby="section-link-title">
      <DialogTitle id="section-link-title">Add link</DialogTitle>
      <DialogContent sx={{ pt: 2 }}><TextField label="Link URL" type="url" value={linkHref} onChange={event => setLinkHref(event.target.value)} placeholder="https://example.com" fullWidth/></DialogContent>
      <DialogActions><Button onClick={() => setLinkOpen(false)}>Cancel</Button><Button variant="contained" disabled={!/^https?:\/\//i.test(linkHref)} onClick={() => { editor.chain().focus().setLink({ href: linkHref }).run(); setLinkOpen(false); }}>Add link</Button></DialogActions>
    </Dialog>
  </>;
}
