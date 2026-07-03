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

  it("describes recoverable preview load errors in Korean", () => {
    expect(
      describePreviewFailure(new TypeError("Failed to fetch dynamically imported module"), "ko"),
    ).toEqual({
      detail:
        "미리보기 코드를 불러오지 못했습니다. 앱 업데이트 후에는 새로고침으로 해결되는 경우가 많습니다.",
      title: "미리보기를 새로고침해야 합니다",
    })
  })
})
