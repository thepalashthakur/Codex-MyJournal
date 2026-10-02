import { NewEntry } from "@/components/new-entry";
import { listJournals } from "@/lib/journal-service";
import Link from "next/link";
export default async function NewEntryPage() { const journals = await listJournals(); return <main className="page narrow"><header className="page-header"><div><p className="eyebrow">CAPTURE A MOMENT</p><h1>New entry</h1><p>Choose where this story belongs.</p></div></header>{journals.length ? <NewEntry journals={journals} /> : <div className="empty-state"><h2>Create a journal first</h2><p>Journals give your entries a home.</p><Link href="/journals" className="button primary">Create journal</Link></div>}</main>; }
