import Link from "next/link";
import { EntryCard } from "@/components/entry-card";
import { EmptyState } from "@/components/empty-state";
import { listEntries, listJournals } from "@/lib/journal-service";
import { localDateOf } from "@/lib/dates";
export default async function Today() {
  const [entries, journals] = await Promise.all([listEntries({ limit: 12 }), listJournals()]);
  const today = localDateOf(new Date(), "UTC");
  const todayEntries = entries.filter(entry => entry.local_date === today);
  return <main className="page narrow"><header className="page-header"><div><p className="eyebrow">YOUR SPACE TO REFLECT</p><h1>Today</h1><p>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</p></div><Link className="button primary" href="/entries/new">+ Write an entry</Link></header><section className="welcome-panel"><p className="eyebrow">A MOMENT FOR YOURSELF</p><h2>What would you like to remember?</h2><p>It can be a sentence, a story, or just how today feels.</p><Link href="/entries/new" className="button primary">Start writing</Link></section><div className="section-heading"><h2>Your day</h2><span>{todayEntries.length} {todayEntries.length === 1 ? "entry" : "entries"}</span></div>{todayEntries.length ? <div className="entry-list">{todayEntries.map(entry => <EntryCard key={entry.id} entry={entry} />)}</div> : <EmptyState title="Your journal starts here" description={journals.length ? "Write a few words about today. There is no right way to begin." : "Create a journal and begin keeping your days."} />}</main>;
}
