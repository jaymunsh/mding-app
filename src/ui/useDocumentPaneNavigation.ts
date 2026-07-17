import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { DocumentFormat } from "../domain/workspace"
import { shouldNavigateBackFromEdgeSwipe, startsFromBackSwipeEdge } from "./documentGestures"

const previewFocusHistoryKey = "mdingPreviewFocus"

type NavigationRequest = {
  readonly documentFormat: DocumentFormat
  readonly isEditing: boolean
  readonly selectedNodeId: string | null
  readonly onBack: () => void
}

type PreviewFocusRequest = {
  readonly documentFormat: DocumentFormat
  readonly isEditing: boolean
}

type ActiveBackSwipe = {
  readonly pointerId: number
  readonly startX: number
  readonly startY: number
}

export type DocumentPaneNavigation = {
  readonly enterPreviewFocus: () => void
  readonly exitPreviewFocus: () => void
  readonly isPreviewFocus: boolean
  readonly cancelBackSwipe: () => void
  readonly handlePointerDown: (event: ReactPointerEvent<HTMLElement>) => void
  readonly handlePointerUp: (event: ReactPointerEvent<HTMLElement>) => void
}

export function canEnterPreviewFocus(request: PreviewFocusRequest): boolean {
  return (
    !request.isEditing &&
    (request.documentFormat === DocumentFormat.Markdown ||
      request.documentFormat === DocumentFormat.Html)
  )
}

export function shouldExitPreviewFocusFromKeyboard(key: string): boolean {
  return key === "Escape"
}

export function useDocumentPaneNavigation(request: NavigationRequest): DocumentPaneNavigation {
  const [isPreviewFocus, setIsPreviewFocus] = useState(false)
  const activeBackSwipeRef = useRef<ActiveBackSwipe | null>(null)

  const exitPreviewFocus = useCallback(() => {
    if (!isPreviewFocus) {
      return
    }
    setIsPreviewFocus(false)
    if (
      typeof window.history.state === "object" &&
      window.history.state !== null &&
      previewFocusHistoryKey in window.history.state
    ) {
      window.history.back()
    }
  }, [isPreviewFocus])

  const enterPreviewFocus = useCallback(() => {
    if (!canEnterPreviewFocus(request)) {
      return
    }
    window.history.pushState({ [previewFocusHistoryKey]: true }, "")
    setIsPreviewFocus(true)
  }, [request])

  useEffect(() => {
    function handlePopState(): void {
      if (isPreviewFocus) {
        setIsPreviewFocus(false)
      }
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [isPreviewFocus])

  useEffect(() => {
    if (!isPreviewFocus) {
      return
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (shouldExitPreviewFocusFromKeyboard(event.key)) {
        event.preventDefault()
        exitPreviewFocus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [exitPreviewFocus, isPreviewFocus])

  useEffect(() => {
    if (isPreviewFocus && !canEnterPreviewFocus(request)) {
      exitPreviewFocus()
    }
  }, [exitPreviewFocus, isPreviewFocus, request])

  return {
    enterPreviewFocus,
    exitPreviewFocus,
    isPreviewFocus,
    cancelBackSwipe: () => {
      activeBackSwipeRef.current = null
    },
    handlePointerDown: (event) => {
      if (
        event.pointerType !== "touch" ||
        request.isEditing ||
        !startsFromBackSwipeEdge(event.clientX, window.innerWidth)
      ) {
        activeBackSwipeRef.current = null
        return
      }
      activeBackSwipeRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    handlePointerUp: (event) => {
      const activeBackSwipe = activeBackSwipeRef.current
      activeBackSwipeRef.current = null
      if (activeBackSwipe === null || activeBackSwipe.pointerId !== event.pointerId) {
        return
      }
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      if (
        shouldNavigateBackFromEdgeSwipe({
          currentX: event.clientX,
          currentY: event.clientY,
          isEditing: request.isEditing,
          startX: activeBackSwipe.startX,
          startY: activeBackSwipe.startY,
          viewportWidth: window.innerWidth,
        })
      ) {
        if (isPreviewFocus) {
          exitPreviewFocus()
          return
        }
        request.onBack()
      }
    },
  }
}
