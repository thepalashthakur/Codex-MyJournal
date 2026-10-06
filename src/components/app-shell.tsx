"use client";

import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, Compass, Image, LayoutTemplate, MapPinned, Menu, Plus, Search, Settings2, Sparkles, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import ListItemButton from "@mui/material/ListItemButton";
import Tooltip from "@mui/material/Tooltip";

const groups = [
  { title: "Workspace", items: [
    { href: "/today", label: "Today", icon: Sun }, { href: "/timeline", label: "Timeline", icon: BookOpen },
    { href: "/calendar", label: "Calendar", icon: CalendarDays }, { href: "/search", label: "Search", icon: Search },
  ] },
  { title: "Library", items: [
    { href: "/journals", label: "Journals", icon: Compass }, { href: "/media", label: "Media", icon: Image },
    { href: "/map", label: "Map", icon: MapPinned }, { href: "/on-this-day", label: "On This Day", icon: Sparkles },
  ] },
  { title: "Tools", items: [{ href: "/templates", label: "Templates", icon: LayoutTemplate }] },
];

function SidebarContent({ email, pathname, close, collapsed, toggle, mobile = false }: { email: string; pathname: string; close: () => void; collapsed: boolean; toggle?: () => void; mobile?: boolean }) {
  return <div className={`sidebar-inner ${collapsed ? "is-collapsed" : ""}`}>
    <div className="sidebar-head"><Tooltip title={collapsed ? "Stillroom" : ""}><Link className="brand" href="/today" onClick={close}>{collapsed ? <BookOpen size={22}/> : <>stillroom<span>.</span></>}</Link></Tooltip>
      {toggle && <Tooltip title={collapsed ? "Expand sidebar (Ctrl + \\)" : "Collapse sidebar (Ctrl + \\)"}><IconButton onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} size="small">{collapsed ? <ChevronRight size={17}/> : <ChevronLeft size={17}/>}</IconButton></Tooltip>}
    </div>
    {!collapsed && <p className="sidebar-caption">A place for your days</p>}
    <Tooltip title={collapsed ? "New entry (Ctrl + Shift + E)" : "Shortcut: Ctrl + Shift + E"} placement="right"><Button component={Link} href="/entries/new" variant="contained" className="new-entry" onClick={close} aria-label="New entry" startIcon={<Plus size={17}/>}>{collapsed ? <span className="sr-only">New entry</span> : "New entry"}</Button></Tooltip>
    <nav aria-label={mobile ? "Mobile navigation" : "Main navigation"}>{groups.map(group => <div className="nav-group" key={group.title}>{!collapsed && <span className="nav-group-label">{group.title}</span>}{group.items.map(({ href, label, icon: Icon }) => { const active = pathname === href || pathname.startsWith(href + "/"); return <Tooltip title={collapsed ? label : ""} placement="right" key={href}><ListItemButton component={Link} href={href} onClick={close} selected={active} aria-label={label} aria-current={active ? "page" : undefined} className="nav-link"><Icon size={18} strokeWidth={1.8}/>{!collapsed && <span>{label}</span>}</ListItemButton></Tooltip>; })}</div>)}</nav>
    <div className="sidebar-foot"><Tooltip title={collapsed ? email : ""}><Avatar className="avatar" aria-label={`Account: ${email}`}>{email.slice(0, 1).toUpperCase()}</Avatar></Tooltip>{!collapsed && <span className="email">{email}</span>}<Tooltip title={collapsed ? "Settings" : ""}><IconButton component={Link} href="/settings" onClick={close} aria-label="Settings" aria-current={pathname.startsWith("/settings") ? "page" : undefined}><Settings2 size={18}/></IconButton></Tooltip></div>
  </div>;
}

export function AppShell({ children, email }: { children: React.ReactNode; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; if (!timezone || document.cookie.includes(`stillroom_timezone=${encodeURIComponent(timezone)}`)) return; document.cookie = `stillroom_timezone=${encodeURIComponent(timezone)}; Path=/; SameSite=Lax; Max-Age=31536000`; router.refresh(); }, [router]);
  useEffect(() => { const task = setTimeout(() => setCollapsed(localStorage.getItem("stillroom-sidebar-collapsed") === "1"), 0); return () => clearTimeout(task); }, []);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      if (event.key === "\\") { event.preventDefault(); setCollapsed(value => { localStorage.setItem("stillroom-sidebar-collapsed", value ? "0" : "1"); return !value; }); }
      if (event.key.toLowerCase() === "k") { event.preventDefault(); router.push("/search"); }
      if (event.shiftKey && event.key.toLowerCase() === "e") { event.preventDefault(); router.push("/entries/new"); }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [router]);
  const toggle = () => setCollapsed(value => { localStorage.setItem("stillroom-sidebar-collapsed", value ? "0" : "1"); return !value; });
  return <div className={`app-frame ${collapsed ? "sidebar-collapsed" : ""}`}>
    <IconButton className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open navigation" aria-haspopup="dialog" aria-expanded={open}><Menu size={21}/></IconButton>
    <aside className="sidebar"><SidebarContent email={email} pathname={pathname} close={() => setOpen(false)} collapsed={collapsed} toggle={toggle}/></aside>
    <Drawer anchor="left" open={open} onClose={() => setOpen(false)} slotProps={{ paper: { sx: { width: 248, bgcolor: "background.paper" } } }}><SidebarContent email={email} pathname={pathname} close={() => setOpen(false)} collapsed={false} mobile/></Drawer>
    <div className="app-content">{children}</div>
    <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">
      <Link href="/today" aria-current={pathname === "/today" ? "page" : undefined}><Sun size={19}/><span>Today</span></Link>
      <Link href="/timeline" aria-current={pathname === "/timeline" ? "page" : undefined}><BookOpen size={19}/><span>Timeline</span></Link>
      <Link href="/entries/new" className="mobile-create" aria-label="New entry"><Plus size={21}/><span>New</span></Link>
      <Link href="/search" aria-current={pathname === "/search" ? "page" : undefined}><Search size={19}/><span>Search</span></Link>
      <button type="button" onClick={() => setOpen(true)} aria-label="More navigation" aria-expanded={open}><Menu size={19}/><span>More</span></button>
    </nav>
  </div>;
}
