import { describe, expect, it } from "vitest"
import { describePreviewFailure, isPreviewChunkLoadError } from "./PreviewRecovery"

describe("Preview recovery", () => {
  it("recognizes dynamic import failures as recoverable preview load errors", () => {
    expect(
      isPreviewChunkLoadError(new TypeError("Failed to fetch dynamically imported module")),
    ).toBe(true)
    expect(isPreviewChunkLoadError(new Error("Loading chunk 42 failed"))).toBe(true)
    expect(isPreviewChunkLoadError(new Error("Mermaid parse failed"))).toBe(false)
  })

  it("describes recoverable preview load errors without exposing raw internals", () => {
    expect(
      describePreviewFailure(new TypeError("Failed to fetch dynamically imported module")),
    ).toEqual({
      detail:
        "The preview code could not be loaded. Reloading usually fixes this after an app update.",
      title: "Preview needs a reload",
    })
  })
})
