import { describe, expect, it } from "vitest"
import { changelogUrl } from "./changelogLinks"

describe("changelogUrl", () => {
  it("returns the English GitHub changelog for the English UI", () => {
    expect(changelogUrl("en")).toBe("https://github.com/jaymunsh/mding-app/blob/main/CHANGELOG.md")
  })

  it("returns the Korean GitHub changelog for the Korean UI", () => {
    expect(changelogUrl("ko")).toBe(
      "https://github.com/jaymunsh/mding-app/blob/main/CHANGELOG.ko.md",
    )
  })
})
