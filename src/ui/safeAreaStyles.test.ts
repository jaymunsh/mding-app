import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const appCss = readFileSync(new URL("../styles/app.css", import.meta.url), "utf8")
const indexHtml = readFileSync(new URL("../../index.html", import.meta.url), "utf8")

describe("mobile safe-area styles", () => {
  it("keeps the document detail header below the iOS status bar", () => {
    expect(appCss).toMatch(
      /\.screen-document\s+\.document-header\s*\{[^}]*env\(safe-area-inset-top\)/s,
    )
  })

  it("does not use a translucent iOS status bar over app content", () => {
    expect(indexHtml).not.toContain(
      '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
    )
  })
})
