import { describe, expect, it } from "vitest"
import { parseHtmlAnchorScrollMessage, parseHtmlScrollDeltaMessage } from "./HtmlPreview"
import { createHtmlPreviewBridgeScript } from "./htmlPreviewBridge"

describe("HTML preview bridge", () => {
  it("keeps in-page hash links inside the imported HTML document", () => {
    const script = createHtmlPreviewBridgeScript("dark")

    expect(script).toContain('document.addEventListener("click"')
    expect(script).toContain("event.preventDefault()")
    expect(script).toContain("window.scrollBy")
    expect(script).toContain("requestAnimationFrame")
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

  it("posts in-page anchor scroll requests to the parent viewer", () => {
    const script = createHtmlPreviewBridgeScript("light")

    expect(script).toContain('type: "mding:html-anchor-scroll"')
    expect(script).toContain("target.offsetTop")
    expect(script).toContain("window.parent.postMessage")
  })

  it("posts iframe wheel and touch scroll deltas to the parent viewer", () => {
    const script = createHtmlPreviewBridgeScript("light")

    expect(script).toContain('type: "mding:html-scroll-delta"')
    expect(script).toContain('document.addEventListener("wheel"')
    expect(script).toContain('document.addEventListener("touchmove"')
    expect(script).toContain("event.preventDefault()")
  })

  it("parses iframe anchor scroll messages", () => {
    expect(
      parseHtmlAnchorScrollMessage({
        type: "mding:html-anchor-scroll",
        top: 42,
      }),
    ).toBe(42)
    expect(
      parseHtmlAnchorScrollMessage({
        type: "mding:html-anchor-scroll",
        top: -2,
      }),
    ).toBe(0)
    expect(parseHtmlAnchorScrollMessage({ type: "other", top: 40 })).toBeNull()
  })

  it("parses iframe scroll delta messages", () => {
    expect(
      parseHtmlScrollDeltaMessage({
        type: "mding:html-scroll-delta",
        deltaY: 120,
      }),
    ).toBe(120)
    expect(
      parseHtmlScrollDeltaMessage({ type: "mding:html-scroll-delta", deltaY: Number.NaN }),
    ).toBeNull()
    expect(parseHtmlScrollDeltaMessage({ type: "other", deltaY: 120 })).toBeNull()
  })
})
