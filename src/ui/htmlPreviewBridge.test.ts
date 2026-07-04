import { describe, expect, it } from "vitest"
import { parseHtmlReadingProgressMessage } from "./HtmlPreview"
import { createHtmlPreviewBridgeScript } from "./htmlPreviewBridge"

describe("HTML preview bridge", () => {
  it("keeps in-page hash links inside the imported HTML document", () => {
    const script = createHtmlPreviewBridgeScript("dark")

    expect(script).toContain('document.addEventListener("click"')
    expect(script).toContain("event.preventDefault()")
    expect(script).toContain("window.scrollTo")
    expect(script).toContain("requestAnimationFrame")
    expect(script).not.toContain("mding:html-anchor-scroll")
    expect(script).not.toContain("window.location")
    expect(script).not.toContain("location.href")
  })

  it("syncs app color mode without overriding imported document styles", () => {
    const script = createHtmlPreviewBridgeScript("light")

    expect(script).toContain('var appTheme = "light"')
    expect(script).toContain("document.documentElement.dataset.mdingTheme = appTheme")
    expect(script).toContain("document.documentElement.dataset.theme = appTheme")
    expect(script).toContain("document.documentElement.style.colorScheme = appTheme")
  })

  it("lets the imported HTML document scroll natively inside the iframe", () => {
    const script = createHtmlPreviewBridgeScript("light")

    expect(script).not.toContain("mding:html-scroll-delta")
    expect(script).not.toContain('document.addEventListener("wheel"')
    expect(script).not.toContain('document.addEventListener("touchmove"')
    expect(script).not.toContain("flushScrollDelta")
  })

  it("posts iframe reading progress to the parent viewer", () => {
    const script = createHtmlPreviewBridgeScript("light", 1, 0.4)

    expect(script).toContain("var initialReadingProgress = 0.4")
    expect(script).toContain('type: "mding:html-reading-progress"')
    expect(script).toContain('window.addEventListener("scroll"')
    expect(script).toContain("window.parent.postMessage")
  })

  it("parses iframe reading progress messages", () => {
    expect(
      parseHtmlReadingProgressMessage({
        type: "mding:html-reading-progress",
        ratio: 0.42,
      }),
    ).toBe(0.42)
    expect(
      parseHtmlReadingProgressMessage({
        type: "mding:html-reading-progress",
        ratio: -1,
      }),
    ).toBe(0)
    expect(
      parseHtmlReadingProgressMessage({
        type: "mding:html-reading-progress",
        ratio: 2,
      }),
    ).toBe(1)
    expect(
      parseHtmlReadingProgressMessage({
        type: "mding:html-reading-progress",
        ratio: Number.NaN,
      }),
    ).toBeNull()
    expect(parseHtmlReadingProgressMessage({ type: "other", ratio: 0.5 })).toBeNull()
  })
})
