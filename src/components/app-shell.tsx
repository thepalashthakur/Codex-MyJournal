"use client";
import { BookOpen, CalendarDays, Compass, Image, LayoutTemplate, MapPinned, Menu, Plus, Search, Settings2, Sparkles, Sun, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import ListItemButton from "@mui/material/ListItemButton";

const items = [
  { href: "/today", label: "Today", icon: Sun }, { href: "/timeline", label: "Timeline", icon: BookOpen },
  { href: "/calendar", label: "Calendar", icon: CalendarDays }, { href: "/journals", label: "Journals", icon: Compass },
  { href: "/media", label: "Media", icon: Image }, { href: "/map", label: "Map", icon: MapPinned },
  { href: "/search", label: "Search", icon: Search }, { href: "/on-this-day", label: "On This Day", icon: Sparkles },
  { href: "/templates", label: "Templates", icon: LayoutTemplate }, { href: "/settings", label: "Settings", icon: Settings2 },
];
export function AppShell({ children, email }: { children: React.ReactNode; email: string }) {
  const pathname = usePathname(); const [open, setOpen] = useState(false);
  const router = useRouter();
  useEffect(() => { const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; if (!timezone || document.cookie.includes(`stillroom_timezone=${encodeURIComponent(timezone)}`)) return; document.cookie = `stillroom_timezone=${encodeURIComponent(timezone)}; Path=/; SameSite=Lax; Max-Age=31536000`; router.refresh(); }, [router]);
  return <div className="app-frame"><IconButton className="mobile-menu" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"}>{open ? <X size={22} /> : <Menu size={22} />}</IconButton><aside className={`sidebar ${open ? "open" : ""}`}><Link className="brand" href="/today" onClick={() => setOpen(false)}>stillroom<span>.</span></Link><p className="sidebar-caption">A place for your days</p><Button component={Link} href="/entries/new" variant="contained" className="new-entry" onClick={() => setOpen(false)} startIcon={<Plus size={17} />}>New entry</Button><nav aria-label="Main navigation">{items.map(({ href, label, icon: Icon }) => <ListItemButton component={Link} key={href} href={href} onClick={() => setOpen(false)} selected={pathname === href || pathname.startsWith(href + "/")} className="nav-link"><Icon size={18} strokeWidth={1.8} /><span>{label}</span></ListItemButton>)}</nav><div className="sidebar-foot"><Avatar className="avatar">{email.slice(0, 1).toUpperCase()}</Avatar><span className="email">{email}</span></div></aside>{open && <button className="nav-scrim" onClick={() => setOpen(false)} aria-label="Close navigation" />}<div className="app-content">{children}</div></div>;
}
