// @vitest-environment happy-dom

import { describe, expect, it } from "vitest"
import {
  applyDocumentSearch,
  clearDocumentSearch,
  setActiveDocumentSearchMatch,
} from "./documentSearch"

describe("document search", () => {
  it("highlights text matches and marks the active match", () => {
    const root = document.createElement("article")
    root.innerHTML = "<h1>Alpha note</h1><p>alpha beta ALPHA</p>"

    const matches = applyDocumentSearch(root, "alpha")
    setActiveDocumentSearchMatch(matches, 1)

    expect(matches).toHaveLength(3)
    expect(matches.map((match) => match.textContent)).toEqual(["Alpha", "alpha", "ALPHA"])
    expect(matches[1]?.classList.contains("active")).toBe(true)
  })

  it("clears existing highlights before applying a new query", () => {
    const root = document.createElement("article")
    root.textContent = "alpha beta"

    applyDocumentSearch(root, "alpha")
    const matches = applyDocumentSearch(root, "beta")

    expect(matches).toHaveLength(1)
    expect(root.querySelectorAll("mark.document-search-match")).toHaveLength(1)
    expect(root.textContent).toBe("alpha beta")
  })

  it("restores plain text when search is cleared", () => {
    const root = document.createElement("article")
    root.textContent = "alpha beta"

    applyDocumentSearch(root, "alpha")
    clearDocumentSearch(root)

    expect(root.querySelector("mark")).toBeNull()
    expect(root.textContent).toBe("alpha beta")
  })
})
