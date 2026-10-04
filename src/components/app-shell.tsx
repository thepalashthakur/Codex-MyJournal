"use client";

import { BookOpen, CalendarDays, Compass, Image, LayoutTemplate, MapPinned, Menu, Plus, Search, Settings2, Sparkles, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import ListItemButton from "@mui/material/ListItemButton";

const items = [
  { href: "/today", label: "Today", icon: Sun }, { href: "/timeline", label: "Timeline", icon: BookOpen },
  { href: "/calendar", label: "Calendar", icon: CalendarDays }, { href: "/journals", label: "Journals", icon: Compass },
  { href: "/media", label: "Media", icon: Image }, { href: "/map", label: "Map", icon: MapPinned },
  { href: "/search", label: "Search", icon: Search }, { href: "/on-this-day", label: "On This Day", icon: Sparkles },
  { href: "/templates", label: "Templates", icon: LayoutTemplate }, { href: "/settings", label: "Settings", icon: Settings2 },
];

function SidebarContent({ email, pathname, close, mobile = false }: { email: string; pathname: string; close: () => void; mobile?: boolean }) {
  return <div className="sidebar-inner"><Link className="brand" href="/today" onClick={close}>stillroom<span>.</span></Link><p className="sidebar-caption">A place for your days</p><Button component={Link} href="/entries/new" variant="contained" className="new-entry" onClick={close} startIcon={<Plus size={17}/>}>New entry</Button><nav aria-label={mobile ? "Mobile navigation" : "Main navigation"}>{items.map(({ href, label, icon: Icon }) => { const active = pathname === href || pathname.startsWith(href + "/"); return <ListItemButton component={Link} key={href} href={href} onClick={close} selected={active} aria-current={active ? "page" : undefined} className="nav-link"><Icon size={18} strokeWidth={1.8}/><span>{label}</span></ListItemButton>; })}</nav><div className="sidebar-foot"><Avatar className="avatar">{email.slice(0, 1).toUpperCase()}</Avatar><span className="email">{email}</span></div></div>;
}

export function AppShell({ children, email }: { children: React.ReactNode; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => { const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; if (!timezone || document.cookie.includes(`stillroom_timezone=${encodeURIComponent(timezone)}`)) return; document.cookie = `stillroom_timezone=${encodeURIComponent(timezone)}; Path=/; SameSite=Lax; Max-Age=31536000`; router.refresh(); }, [router]);
  return <div className="app-frame">
    <IconButton className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open navigation" aria-haspopup="dialog" aria-expanded={open}><Menu size={22}/></IconButton>
    <aside className="sidebar"><SidebarContent email={email} pathname={pathname} close={() => setOpen(false)}/></aside>
    <Drawer anchor="left" open={open} onClose={() => setOpen(false)} slotProps={{ paper: { sx: { width: 260, bgcolor: "background.paper" } } }}><SidebarContent email={email} pathname={pathname} close={() => setOpen(false)} mobile/></Drawer>
    <div className="app-content">{children}</div>
  </div>;
}
