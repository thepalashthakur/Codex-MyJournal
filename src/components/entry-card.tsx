import Link from "next/link";
type EntryCardProps = { entry: { id: string; title: string; content_text: string; local_date: string; is_favorite: boolean; journals: unknown; entry_tags?: unknown; attachments?: unknown } };
export function EntryCard({ entry }: EntryCardProps) {
  const journal = entry.journals as { name: string; color: string } | null;
  const tags = (entry.entry_tags || []) as { tags: { name: string } | null }[];
  const attachments = (entry.attachments || []) as { id: string }[];
  return <Link href={`/entries/${entry.id}`} className="entry-card"><div className="meta"><span>{new Date(`${entry.local_date}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>{journal && <><span>·</span><span className="row" style={{ gap: 5 }}><i className="journal-dot" style={{ background: journal.color }} />{journal.name}</span></>}{entry.is_favorite && <span aria-label="Favorite">★</span>}{attachments.length > 0 && <span>· {attachments.length} media</span>}</div><h2>{entry.title || "Untitled entry"}</h2><p>{entry.content_text?.slice(0, 190) || "A quiet moment, waiting to be written."}</p>{tags.length > 0 && <div className="row" style={{ marginTop: 15 }}>{tags.map((item, index) => item.tags && <span className="tag" key={index}>{item.tags.name}</span>)}</div>}</Link>;
}
