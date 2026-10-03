export function textFromContent(value: unknown): string {
  const parts: string[] = [];
  function visit(node: unknown) {
    if (!node || typeof node !== "object") return;
    const item = node as { type?: unknown; text?: unknown; content?: unknown };
    if (item.type === "text" && typeof item.text === "string") parts.push(item.text);
    if (Array.isArray(item.content)) { for (const child of item.content) visit(child); if (["paragraph","heading","blockquote","listItem","codeBlock"].includes(String(item.type))) parts.push("\n"); }
  }
  visit(value); return parts.join("").trim().slice(0, 500000);
}
