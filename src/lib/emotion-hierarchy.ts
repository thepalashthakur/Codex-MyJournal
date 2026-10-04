export type EmotionNode = { id: string; parent_id: string | null; archived_at: string | null };

export function validateEmotionPlacement(nodes: EmotionNode[], emotionId: string | null, parentId: string | null) {
  if (parentId === null) {
    if (emotionId && subtreeHeight(nodes, emotionId) > 3) throw new Error("Emotion hierarchy is limited to three levels.");
    return;
  }
  const byId = new Map(nodes.map(node => [node.id, node]));
  const seen = new Set<string>(); let cursor: string | null = parentId; let ancestors = 0;
  while (cursor) {
    if (cursor === emotionId || seen.has(cursor)) throw new Error("Emotion hierarchy cannot contain a cycle.");
    seen.add(cursor);
    const node: EmotionNode | undefined = byId.get(cursor);
    if (!node || node.archived_at) throw new Error("Parent emotion not available.");
    ancestors++;
    cursor = node.parent_id;
  }
  if (ancestors + (emotionId ? subtreeHeight(nodes, emotionId) : 0) + 1 > 3) throw new Error("Emotion hierarchy is limited to three levels.");
}

function subtreeHeight(nodes: EmotionNode[], emotionId: string): number {
  const children = nodes.filter(node => node.parent_id === emotionId);
  return children.length ? 1 + Math.max(...children.map(child => subtreeHeight(nodes, child.id))) : 0;
}
