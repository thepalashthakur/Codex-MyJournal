import type { ReactNode } from "react";

type Node = { type?: string; text?: string; attrs?: Record<string, unknown>; marks?: { type?: string; attrs?: Record<string, unknown> }[]; content?: Node[] };
function children(node: Node, prefix: string): ReactNode { return Array.isArray(node.content) ? node.content.map((child, index) => render(child, `${prefix}-${index}`)) : null; }
function render(node: Node, key: string): ReactNode {
  if (!node || typeof node !== "object") return null;
  if (node.type === "text") {
    let value: ReactNode = typeof node.text === "string" ? node.text : "";
    for (const mark of node.marks || []) {
      if (mark.type === "bold") value = <strong key={key}>{value}</strong>;
      else if (mark.type === "italic") value = <em key={key}>{value}</em>;
      else if (mark.type === "strike") value = <s key={key}>{value}</s>;
      else if (mark.type === "code") value = <code key={key}>{value}</code>;
      else if (mark.type === "link") {
        const href = String(mark.attrs?.href || "");
        if (/^https?:\/\//i.test(href)) value = <a key={key} href={href} target="_blank" rel="noopener noreferrer">{value}</a>;
      }
    }
    return value;
  }
  const inner = children(node, key);
  switch (node.type) {
    case "doc": return <div key={key}>{inner}</div>;
    case "paragraph": return <p key={key}>{inner || "\u00a0"}</p>;
    case "heading": { const level = Number(node.attrs?.level) === 3 ? 3 : 2; return level === 3 ? <h3 key={key}>{inner}</h3> : <h2 key={key}>{inner}</h2>; }
    case "blockquote": return <blockquote key={key}>{inner}</blockquote>;
    case "bulletList": return <ul key={key}>{inner}</ul>;
    case "orderedList": return <ol key={key} start={Number(node.attrs?.start) || 1}>{inner}</ol>;
    case "listItem": return <li key={key}>{inner}</li>;
    case "taskList": return <ul key={key} className="reader-tasks">{inner}</ul>;
    case "taskItem": return <li key={key}><input type="checkbox" checked={node.attrs?.checked === true} readOnly aria-label="Checklist item" />{inner}</li>;
    case "codeBlock": return <pre key={key}><code>{inner}</code></pre>;
    case "horizontalRule": return <hr key={key} />;
    case "hardBreak": return <br key={key} />;
    default: return <span key={key}>{inner}</span>;
  }
}
export function RichContent({ content }: { content: unknown }) { return render(content as Node, "root"); }
