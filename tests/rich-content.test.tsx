import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RichContent } from "../src/components/rich-content";

describe("structured reader", () => {
  it("preserves formatting and escapes entry text", () => {
    const html = renderToStaticMarkup(<RichContent content={{ type: "doc", content: [{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "A <day>" }] }, { type: "paragraph", content: [{ type: "text", text: "remember", marks: [{ type: "bold" }] }] }] }} />);
    expect(html).toContain("<h2>A &lt;day&gt;</h2>");
    expect(html).toContain("<strong>remember</strong>");
  });
  it("does not render unsafe link schemes", () => {
    const html = renderToStaticMarkup(<RichContent content={{ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "click", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] }] }} />);
    expect(html).not.toContain("href=");
    expect(html).toContain("click");
  });
});
