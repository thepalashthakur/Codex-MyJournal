"use client";
import { useState } from "react";
import Link from "next/link";
import { simpleWorldMap } from "@/lib/integrations/map";
type Point = { id: string; label: string; latitude: number; longitude: number; date: string };
export function MapPlot({ points }: { points: Point[] }) {
  const [selected, setSelected] = useState<Point | null>(null);
  return <div className="map-panel"><svg viewBox="0 0 1000 500" role="img" aria-label="Map of entry locations"><rect width="1000" height="500" fill="#f4f1e8" />{[125,250,375].map(y => <line key={y} x1="0" x2="1000" y1={y} y2={y} stroke="#e5e1d6" />)}{[250,500,750].map(x => <line key={x} y1="0" y2="500" x1={x} x2={x} stroke="#e5e1d6" />)}{points.map(point => { const { x, y } = simpleWorldMap.project({ ...point }); return <circle key={point.id} cx={x} cy={y} r="8" fill="#eb5e28" stroke="white" strokeWidth="3" className="map-marker" role="button" tabIndex={0} aria-label={`${point.label}, ${point.date}`} onClick={() => setSelected(point)} onKeyDown={event => { if (event.key === "Enter") setSelected(point); }} />; })}</svg>{selected && <div className="map-detail"><strong>{selected.label}</strong><span>{selected.date}</span><Link href={`/entries/${selected.id}`} className="text-button">Read entry →</Link></div>}<p className="muted">Locations are plotted locally from coordinates you added. No external map service receives your entries.</p></div>;
}
