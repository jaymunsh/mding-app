import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const appCss = readFileSync(new URL("../styles/app.css", import.meta.url), "utf8")

describe("sidebar grid placement", () => {
  it("keeps the document region in the content column when the sidebar is hidden", () => {
    expect(appCss).toMatch(/\.document-region\s*{[^}]*grid-column:\s*3;/s)
    expect(appCss).toMatch(
      /@media\s*\(max-width:\s*759px\)[\s\S]*\.document-region\s*{[^}]*grid-column:\s*1;/s,
    )
  })
})

describe("update history dialog text wrapping", () => {
  it("keeps Korean words together with safe overflow fallback", () => {
    expect(appCss).toMatch(
      /\.update-history-dialog\s*{[^}]*word-break:\s*keep-all;[^}]*overflow-wrap:\s*anywhere;/s,
    )
  })
})

describe("focused reading controls", () => {
  it("keeps the exit control at the safe top-right and never condenses the document header", () => {
    expect(appCss).toMatch(
      /\.preview-focus-exit\s*{[^}]*top:\s*calc\(var\(--space-3\) \+ env\(safe-area-inset-top\)\);[^}]*right:\s*calc\(var\(--space-3\) \+ env\(safe-area-inset-right\)\);/s,
    )
    expect(appCss).not.toContain(".header-condensed")
  })
})
