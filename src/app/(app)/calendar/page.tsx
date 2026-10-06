import Link from "next/link";
import { userDb } from "@/lib/db";
import { monthBounds } from "@/lib/dates";
import { viewerTimezone } from "@/lib/viewer-timezone";
import { localDateOf } from "@/lib/dates";
import { EntryCard } from "@/components/entry-card";
import { entriesForDate } from "@/lib/journal-service";
export default async function Calendar({ searchParams }: { searchParams: Promise<{ month?: string; date?: string }> }) {
  const params = await searchParams; const timezone = await viewerTimezone(); const today = localDateOf(new Date(), timezone); const current = today.slice(0, 7);
  let month = params.month || current; try { monthBounds(month); } catch { month = current; }
  const { start, end } = monthBounds(month); const [year, number] = month.split("-").map(Number);
  const { db } = await userDb(); const { data: dates, error } = await db.rpc("calendar_day_counts", { p_start: start, p_end: end });
  if (error) throw error;
  const counts = new Map<string, number>(); for (const item of dates || []) counts.set(item.local_date, Number(item.entry_count));
  const selected = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) && params.date.startsWith(month) ? params.date : ""; const selectedEntries = selected ? await entriesForDate(selected) : [];
  const first = new Date(Date.UTC(year, number - 1, 1)).getUTCDay(); const days = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const previous = new Date(Date.UTC(year, number - 2, 1)).toISOString().slice(0, 7); const next = new Date(Date.UTC(year, number, 1)).toISOString().slice(0, 7);
  return <main className="page narrow"><header className="page-header"><div><p className="eyebrow">A MONTH AT A GLANCE</p><h1>Calendar</h1></div></header><div className="calendar-toolbar"><Link className="button" href={`/calendar?month=${previous}`} aria-label="Previous month">←</Link><h2>{new Date(Date.UTC(year, number - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}</h2><div className="row"><Link className="button subtle" href={`/calendar?month=${current}&date=${today}`}>Today</Link><Link className="button" href={`/calendar?month=${next}`} aria-label="Next month">→</Link></div></div><div className="calendar-grid">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day => <div key={day} className="calendar-cell calendar-weekday">{day}</div>)}{Array.from({ length: first }, (_, index) => <div className="calendar-cell" aria-hidden="true" key={`blank-${index}`} />)}{Array.from({ length: days }, (_, index) => { const date = `${month}-${String(index + 1).padStart(2, "0")}`; const count = counts.get(date) || 0; return <Link href={`/calendar?month=${month}&date=${date}`} key={date} className={`calendar-cell ${date === today ? "is-today" : ""} ${date === selected ? "is-selected" : ""}`} aria-current={date === today ? "date" : undefined} aria-label={`${date}, ${count} ${count === 1 ? "entry" : "entries"}`}><span>{index + 1}</span>{count > 0 && <span className="day-indicator" aria-hidden="true"/>}</Link>; })}</div>{selected && <section className="calendar-date-details"><h2>{new Date(`${selected}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</h2>{selectedEntries.length ? <div className="entry-list">{selectedEntries.map(entry => <EntryCard entry={entry} key={entry.id} />)}</div> : <p className="muted">No entries for this day.</p>}</section>}</main>;
}
