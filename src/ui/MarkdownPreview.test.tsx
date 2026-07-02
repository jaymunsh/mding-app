import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { MarkdownPreview, parseCalloutMarker, parseCodeLanguage } from "./MarkdownPreview"

describe("Markdown preview", () => {
  it("renders GFM blocks and escapes raw HTML", () => {
    const html = renderToStaticMarkup(
      <MarkdownPreview
        markdown={`# Title

**Strong**

---

| A | B |
| - | - |
| 1 | 2 |

- [x] done

<script>alert("x")</script>`}
      />,
    )

    expect(html).toContain("<strong>Strong</strong>")
    expect(html).toContain("<hr/>")
    expect(html).toContain("<table>")
    expect(html).toContain("checked")
    expect(html).not.toContain("<script>")
  })

  it("detects Mermaid code fences from language classes", () => {
    expect(parseCodeLanguage("language-mermaid")).toBe("mermaid")
  })

  it("parses Obsidian callout markers and fold states", () => {
    expect(parseCalloutMarker("[!NOTE] Product note")).toEqual({
      fold: "none",
      kind: "note",
      title: "Product note",
    })
    expect(parseCalloutMarker("[!WARNING]- Hidden risk")).toEqual({
      fold: "closed",
      kind: "warning",
      title: "Hidden risk",
    })
    expect(parseCalloutMarker("[!TIP]+ Open tip")).toEqual({
      fold: "open",
      kind: "tip",
      title: "Open tip",
    })
  })

  it("renders Obsidian callouts and folded callouts as document effects", () => {
    const html = renderToStaticMarkup(
      <MarkdownPreview
        markdown={`> [!NOTE] Product note
> Callout body

> [!WARNING]- Hidden risk
> Folded body`}
      />,
    )

    expect(html).toContain("markdown-callout markdown-callout-note")
    expect(html).toContain("Product note")
    expect(html).toContain("Callout body")
    expect(html).toContain("<details")
    expect(html).toContain("markdown-callout markdown-callout-warning")
    expect(html).toContain("Hidden risk")
  })
})
