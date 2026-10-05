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
  return <main className="page narrow"><header className="page-header"><div><p className="eyebrow">FROM YEARS PAST</p><h1>On This Day</h1><p>Little windows into who you were, and what mattered.</p></div></header><div className="toolbar"><Link className="button subtle" href="/on-this-day">All journals</Link>{journals.map(j => <Link key={j.id} className="button subtle" href={`/on-this-day?journal=${j.id}`}>{j.name}</Link>)}</div>{entries.length ? <div className="entry-list">{entries.map(entry => <EntryCard key={entry.id} entry={{ ...entry, journals: journalMap.get(entry.journal_id) || null }} />)}</div> : <div className="empty-state"><span style={{ fontSize: 36 }}>✦</span><h2>No memories from this day yet</h2><p>In time, your past entries will find you here.</p></div>}</main>;
}
