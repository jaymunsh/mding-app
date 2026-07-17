import { describe, expect, it } from "vitest"
import { DocumentFormat } from "../domain/workspace"
import { shouldNavigateBackFromEdgeSwipe } from "./documentGestures"
import {
  canEnterPreviewFocus,
  shouldExitPreviewFocusFromKeyboard,
} from "./useDocumentPaneNavigation"

describe("Preview focus", () => {
  it("allows explicit focus for Markdown and HTML previews only", () => {
    expect(
      canEnterPreviewFocus({ documentFormat: DocumentFormat.Markdown, isEditing: false }),
    ).toBe(true)
    expect(canEnterPreviewFocus({ documentFormat: DocumentFormat.Html, isEditing: false })).toBe(
      true,
    )
    expect(canEnterPreviewFocus({ documentFormat: DocumentFormat.Markdown, isEditing: true })).toBe(
      false,
    )
  })

  it("exits focused reading with Escape", () => {
    expect(shouldExitPreviewFocusFromKeyboard("Escape")).toBe(true)
    expect(shouldExitPreviewFocusFromKeyboard("Enter")).toBe(false)
  })
})

describe("Document pane edge swipe", () => {
  it("navigates back only for a mobile left-edge horizontal swipe", () => {
    expect(
      shouldNavigateBackFromEdgeSwipe({
        currentX: 96,
        currentY: 218,
        isEditing: false,
        startX: 12,
        startY: 220,
        viewportWidth: 390,
      }),
    ).toBe(true)
  })

  it("ignores desktop, editor, non-edge, short, and vertical swipes", () => {
    const baseGesture = {
      currentX: 96,
      currentY: 218,
      isEditing: false,
      startX: 12,
      startY: 220,
      viewportWidth: 390,
    } as const

    expect(
      shouldNavigateBackFromEdgeSwipe({
        ...baseGesture,
        viewportWidth: 900,
      }),
    ).toBe(false)
    expect(
      shouldNavigateBackFromEdgeSwipe({
        ...baseGesture,
        isEditing: true,
      }),
    ).toBe(false)
    expect(
      shouldNavigateBackFromEdgeSwipe({
        ...baseGesture,
        startX: 48,
      }),
    ).toBe(false)
    expect(
      shouldNavigateBackFromEdgeSwipe({
        ...baseGesture,
        currentX: 56,
      }),
    ).toBe(false)
    expect(
      shouldNavigateBackFromEdgeSwipe({
        ...baseGesture,
        currentY: 320,
      }),
    ).toBe(false)
  })
})
