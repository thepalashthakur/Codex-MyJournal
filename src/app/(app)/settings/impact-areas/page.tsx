import Link from "next/link";
import { ImpactManager } from "@/components/impact-manager";
import { listImpactLibrary } from "@/lib/context-service";

export default async function ImpactSettings() {
  const { areas, entities } = await listImpactLibrary();
  return <main className="page narrow"><Link href="/settings" className="muted">← Settings</Link><header className="page-header"><div><p className="eyebrow">YOUR LIFE CONTEXT</p><h1>Impact areas</h1><p>Manage the broad areas and specific things you connect to journal sections.</p></div></header><ImpactManager initialAreas={areas} initialEntities={entities}/></main>;
}
