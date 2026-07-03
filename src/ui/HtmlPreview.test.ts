import { describe, expect, it } from "vitest"
import { createHtmlPreviewErrorDocument } from "./HtmlPreview"

describe("HTML preview", () => {
  it("renders an in-frame error document when preview generation fails", () => {
    const document = createHtmlPreviewErrorDocument(
      "light",
      1,
      new Error('Preview <script>alert("x")</script> failed'),
    )

    expect(document).toContain("HTML preview could not load")
    expect(document).toContain("Preview &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; failed")
    expect(document).not.toContain("<script>alert")
  })
})
