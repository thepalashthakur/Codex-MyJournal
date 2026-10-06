import { userDb } from "@/lib/db";
import { listJournals, withEntrySectionPreviews } from "@/lib/journal-service";
import { localDateOf } from "@/lib/dates";
import { viewerTimezone } from "@/lib/viewer-timezone";
import { EntryCard } from "@/components/entry-card";
import Link from "next/link";
export default async function OnThisDay({ searchParams }: { searchParams: Promise<{ journal?: string }> }) {
  const params = await searchParams; const timezone = await viewerTimezone(); const today = localDateOf(new Date(), timezone);
  const [year, month, day] = today.split("-").map(Number);
  const [{ db }, journals] = await Promise.all([userDb(), listJournals()]);
  // Leap day matches only actual February 29 entries, not February 28 memories.
  const { data: rows, error } = await db.rpc("on_this_day", { p_year: year, p_month: month, p_day: day, p_journal: params.journal || null });
  if (error) throw error;
  const journalMap = new Map(journals.map(j => [j.id, j]));
  const entries = await withEntrySectionPreviews((rows || []) as (Parameters<typeof EntryCard>[0]["entry"] & { journal_id: string })[]);
  const byYear = new Map<string, typeof entries>();
  for (const entry of entries) { const year = entry.local_date.slice(0, 4); byYear.set(year, [...(byYear.get(year) || []), entry]); }
  return <main className="page narrow"><header className="page-header"><div><p className="eyebrow">FROM YEARS PAST</p><h1>On This Day</h1><p>Little windows into who you were, and what mattered.</p></div></header><details className="filter-disclosure" open={Boolean(params.journal)}><summary>Journals{params.journal ? " · Active" : ""}</summary><div className="toolbar"><Link className="button subtle compact-filter" href="/on-this-day" aria-current={!params.journal ? "page" : undefined}>All journals</Link>{journals.map(j => <Link key={j.id} className="button subtle compact-filter" href={`/on-this-day?journal=${j.id}`} aria-current={params.journal === j.id ? "page" : undefined}>{j.name}</Link>)}</div></details>{entries.length ? <div>{Array.from(byYear, ([year, items]) => <section key={year} className="memory-year"><h2>{year}</h2><div className="entry-list">{items.map(entry => <EntryCard key={entry.id} entry={{ ...entry, journals: journalMap.get(entry.journal_id) || null }} />)}</div></section>)}</div> : <div className="empty-state"><h2>No memories from this day yet</h2><p>In time, your past entries will find you here.</p></div>}</main>;
}
