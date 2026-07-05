import { describe, expect, it } from "vitest"
import { Screen } from "../app/workspaceState"
import { createDocumentSearchResetSignal } from "./documentSearchState"

describe("document search state", () => {
  it("changes the reset signal when leaving the document screen", () => {
    const documentSignal = createDocumentSearchResetSignal({
      isEditing: false,
      screen: Screen.Document,
      selectedNodeId: "doc-1",
    })
    const browserSignal = createDocumentSearchResetSignal({
      isEditing: false,
      screen: Screen.Browser,
      selectedNodeId: "doc-1",
    })

    expect(browserSignal).not.toBe(documentSignal)
  })
})
