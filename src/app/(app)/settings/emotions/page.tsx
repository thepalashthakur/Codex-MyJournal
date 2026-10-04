import Link from "next/link";
import { EmotionManager } from "@/components/emotion-manager";
import { listEmotionLibrary } from "@/lib/context-service";

export default async function EmotionSettings() {
  const emotions = await listEmotionLibrary();
  return <main className="page narrow"><Link href="/settings" className="muted">← Settings</Link><header className="page-header"><div><p className="eyebrow">YOUR EMOTION LIBRARY</p><h1>Emotions</h1><p>Shape the words you use to describe each moment.</p></div></header><EmotionManager initialEmotions={emotions}/></main>;
}
