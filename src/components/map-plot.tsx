"use client";
import { useState } from "react";
import Link from "next/link";
import { simpleWorldMap } from "@/lib/integrations/map";
type Point = { id: string; label: string; latitude: number; longitude: number; date: string };
export function MapPlot({ points }: { points: Point[] }) {
  const [selected, setSelected] = useState<Point | null>(null);
  return <div className="map-view"><svg viewBox="0 0 1000 500" role="img" aria-label="Map of entry locations"><rect width="1000" height="500" fill="var(--subtle)" />{[125,250,375].map(y => <line key={y} x1="0" x2="1000" y1={y} y2={y} stroke="var(--line)" />)}{[250,500,750].map(x => <line key={x} y1="0" y2="500" x1={x} x2={x} stroke="var(--line)" />)}{points.map(point => { const { x, y } = simpleWorldMap.project({ ...point }); return <circle key={point.id} cx={x} cy={y} r="8" fill="var(--accent)" stroke="var(--surface)" strokeWidth="3" className="map-marker" role="button" tabIndex={0} aria-label={`${point.label}, ${point.date}`} onClick={() => setSelected(point)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(point); } }} />; })}</svg>{selected && <div className="map-detail"><strong>{selected.label}</strong><span>{selected.date}</span><Link href={`/entries/${selected.id}`} className="text-button">Read entry →</Link></div>}<details className="map-list"><summary>Browse locations as a list</summary><div>{points.map(point => <Link href={`/entries/${point.id}`} key={point.id}>{point.label}<span>{point.date}</span></Link>)}</div></details><p className="muted">Locations are plotted locally from coordinates you added. No external map service receives your entries.</p></div>;
}
