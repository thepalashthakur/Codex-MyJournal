import { EntryCard } from "@/components/entry-card";
import { EmptyState } from "@/components/empty-state";
import { listEntries, listJournals, listTags } from "@/lib/journal-service";
import Link from "next/link";
export default async function Timeline({ searchParams }: { searchParams: Promise<{ journal?: string; tag?: string; before?: string; favorites?: string }> }) {
  const params = await searchParams;
  const [entries, journals, tags] = await Promise.all([listEntries({ journalId: params.journal, tagId: params.tag, before: params.before, favorites: params.favorites === "1", limit: 20 }), listJournals(), listTags()]);
  const last = entries.at(-1);
  return <main className="page narrow"><header className="page-header"><div><p className="eyebrow">THE DAYS, IN ORDER</p><h1>Timeline</h1><p>Every moment you have kept, one page at a time.</p></div><Link href="/entries/new" className="button primary">+ New entry</Link></header><div className="toolbar"><Link className="button subtle" href="/timeline">All journals</Link>{journals.map(j => <Link className="button subtle" href={`/timeline?journal=${j.id}`} key={j.id}>{j.name}</Link>)}<Link className="button subtle" href="/timeline?favorites=1">☆ Favorites</Link>{tags.map(tag => <Link className="button subtle" href={`/timeline?tag=${tag.id}`} key={tag.id}># {tag.name}</Link>)}</div>{entries.length ? <><div className="entry-list">{entries.map(entry => <EntryCard key={entry.id} entry={entry} />)}</div>{entries.length === 20 && last && <div style={{ textAlign: "center", marginTop: 25 }}><Link className="button" href={`/timeline?${new URLSearchParams({ ...(params.journal && { journal: params.journal }), ...(params.tag && { tag: params.tag }), ...(params.favorites && { favorites: params.favorites }), before: last.entry_date })}`}>Older entries</Link></div>}</> : <EmptyState title="The story begins here" description="Your entries will appear in chronological order as you write." />}</main>;
}
