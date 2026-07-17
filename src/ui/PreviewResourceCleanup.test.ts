// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest"
import { createHtmlPreviewDocument, disposeHtmlPreviewFrame } from "./HtmlPreview"
import { renderMermaidSvg, subscribeMermaidColorMode } from "./MermaidPreview"

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("preview resource cleanup", () => {
  it("stops and clears an HTML iframe when its document is disposed", () => {
    // Given
    const stop = vi.fn()
    const frame = {
      contentWindow: { stop },
      srcdoc: "<!doctype html><html><body>large document</body></html>",
    }

    // When
    disposeHtmlPreviewFrame(frame)

    // Then
    expect(stop).toHaveBeenCalledOnce()
    expect(frame.srcdoc).not.toContain("large document")
  })

  it("shares one theme observer until the final Mermaid subscriber leaves", () => {
    // Given
    const disconnect = vi.fn()
    const observe = vi.fn()
    const observer = vi.fn(
      class {
        disconnect = disconnect
        observe = observe
        takeRecords = () => []
      },
    )
    vi.stubGlobal("MutationObserver", observer)

    // When
    const unsubscribeFirst = subscribeMermaidColorMode(vi.fn())
    const unsubscribeSecond = subscribeMermaidColorMode(vi.fn())

    // Then
    expect(observer).toHaveBeenCalledOnce()
    unsubscribeFirst()
    expect(disconnect).not.toHaveBeenCalled()
    unsubscribeSecond()
    expect(disconnect).toHaveBeenCalledOnce()
  })

  it("stops an obsolete HTML build before parsing its document", async () => {
    // Given
    const controller = new AbortController()
    controller.abort()

    // When
    const build = createHtmlPreviewDocument(
      "<!doctype html><html><body>obsolete</body></html>",
      "light",
      "cancelled-preview",
      1,
      0,
      controller.signal,
    )

    // Then
    await expect(build).rejects.toMatchObject({ name: "AbortError" })
  })

  it("stops an obsolete Mermaid render before loading the renderer", async () => {
    // Given
    const controller = new AbortController()
    controller.abort()

    // When
    const render = renderMermaidSvg("graph TD; A-->B", "light", "cancelled", controller.signal)

    // Then
    await expect(render).rejects.toMatchObject({ name: "AbortError" })
  })
})
