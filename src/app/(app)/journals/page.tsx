import { JournalManager } from "@/components/journal-manager";
import { listJournals } from "@/lib/journal-service";
export default async function Journals() { const journals = await listJournals(true); return <main className="page"><header className="page-header"><div><p className="eyebrow">KEEP THINGS TOGETHER</p><h1>Journals</h1><p>Different places for different parts of your life.</p></div></header><JournalManager journals={journals} /></main>; }
