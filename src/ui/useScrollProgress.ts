import { type RefObject, useEffect, useRef } from "react"

const progressSaveDelayMs = 250
const restoreFrameCount = 45

type ScrollProgressOptions = {
  readonly documentId: string
  readonly enabled: boolean
  readonly initialRatio: number
  readonly onProgressChange: (documentId: string, ratio: number) => void
}

export type ScrollMetrics = {
  readonly clientHeight: number
  readonly scrollHeight: number
  readonly scrollTop: number
}

export function useScrollProgress<T extends HTMLElement>(
  options: ScrollProgressOptions,
): RefObject<T | null> {
  const elementRef = useRef<T>(null)
  const initialRatioRef = useRef(options.initialRatio)
  const saveTimerRef = useRef<number | null>(null)
  const onProgressChangeRef = useRef(options.onProgressChange)

  useEffect(() => {
    onProgressChangeRef.current = options.onProgressChange
  }, [options.onProgressChange])

  useEffect(() => {
    const element = elementRef.current
    if (!options.enabled || element === null) {
      return
    }

    return restoreScrollRatio(element, initialRatioRef.current)
  }, [options.enabled])

  useEffect(() => {
    const element = elementRef.current
    if (!options.enabled || element === null) {
      return
    }
    const scrollElement = element

    function saveNow(): void {
      onProgressChangeRef.current(options.documentId, scrollRatio(scrollElement))
    }

    function scheduleSave(): void {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
      }
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null
        saveNow()
      }, progressSaveDelayMs)
    }

    scrollElement.addEventListener("scroll", scheduleSave, { passive: true })

    return () => {
      scrollElement.removeEventListener("scroll", scheduleSave)
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      if (scrollElement.isConnected) {
        saveNow()
      }
    }
  }, [options.documentId, options.enabled])

  return elementRef
}

export function scrollRatio(element: ScrollMetrics): number {
  const maxScrollTop = element.scrollHeight - element.clientHeight
  if (maxScrollTop <= 0) {
    return 0
  }
  return clampRatio(element.scrollTop / maxScrollTop)
}

export function scrollTopForRatio(element: ScrollMetrics, ratio: number): number {
  const maxScrollTop = element.scrollHeight - element.clientHeight
  return Math.round(Math.max(0, maxScrollTop) * clampRatio(ratio))
}

function restoreScrollRatio(element: HTMLElement, ratio: number): () => void {
  let frame = 0
  let animationFrame = 0
  let cancelled = false
  let lastAppliedTop: number | null = null

  function restore(): void {
    if (cancelled) {
      return
    }
    const nextTop = scrollTopForRatio(element, ratio)
    if (
      lastAppliedTop === null &&
      element.scrollTop > 2 &&
      Math.abs(element.scrollTop - nextTop) > 2
    ) {
      return
    }
    if (lastAppliedTop !== null && Math.abs(element.scrollTop - lastAppliedTop) > 2) {
      return
    }
    element.scrollTop = nextTop
    lastAppliedTop = nextTop
    frame += 1
    if (frame < restoreFrameCount) {
      animationFrame = window.requestAnimationFrame(restore)
    }
  }

  animationFrame = window.requestAnimationFrame(restore)

  return () => {
    cancelled = true
    window.cancelAnimationFrame(animationFrame)
  }
}

function clampRatio(ratio: number): number {
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return 0
  }
  if (ratio >= 1) {
    return 1
  }
  return ratio
}
