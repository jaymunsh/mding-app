import { describe, expect, it } from "vitest"
import { createHtmlPreviewErrorDocument } from "./HtmlPreview"

describe("HTML preview", () => {
  it("renders an in-frame error document when preview generation fails", () => {
    const document = createHtmlPreviewErrorDocument(
      "light",
      1,
      "en",
      new Error('Preview <script>alert("x")</script> failed'),
    )

    expect(document).toContain("HTML preview could not load")
    expect(document).toContain("Preview &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; failed")
    expect(document).not.toContain("<script>alert")
  })

  it("renders Korean copy in the in-frame error document", () => {
    const document = createHtmlPreviewErrorDocument("light", 1, "ko", new Error("preview failed"))

    expect(document).toContain("HTML 미리보기를 불러올 수 없습니다")
  })
})
