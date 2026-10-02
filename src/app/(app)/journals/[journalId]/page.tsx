import { EntryCard } from "@/components/entry-card";
import { EmptyState } from "@/components/empty-state";
import { listEntries, listJournals } from "@/lib/journal-service";
import { notFound } from "next/navigation";
export default async function JournalPage({ params }: { params: Promise<{ journalId: string }> }) { const id = (await params).journalId; const [journals, entries] = await Promise.all([listJournals(true), listEntries({ journalId: id })]); const journal = journals.find(item => item.id === id); if (!journal) notFound(); return <main className="page narrow"><header className="page-header"><div><p className="eyebrow">JOURNAL</p><h1>{journal.name}</h1><p>{journal.description || "A space for what matters."}</p></div></header>{entries.length ? <div className="entry-list">{entries.map(entry => <EntryCard key={entry.id} entry={entry} />)}</div> : <EmptyState title="Nothing here yet" description="The first entry in this journal is yours to write." />}</main>; }
