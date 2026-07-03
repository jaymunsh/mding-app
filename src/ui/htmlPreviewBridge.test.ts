import { describe, expect, it } from "vitest"
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
})
