import Link from "next/link";
export function EmptyState({ title, description, action = "New entry" }: { title: string; description: string; action?: string }) { return <div className="empty-state"><div style={{ fontSize: 35, color: "#eb5e28" }}>✦</div><h2>{title}</h2><p>{description}</p><Link href="/entries/new" className="button primary">{action}</Link></div>; }
