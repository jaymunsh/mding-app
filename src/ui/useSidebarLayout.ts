import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useState,
} from "react"
import { z } from "zod"

const SIDEBAR_MIN_WIDTH = 232
const SIDEBAR_MAX_WIDTH = 340
const sidebarWidthKey = "mding.sidebarWidth"
const sidebarCollapsedKey = "mding.sidebarCollapsed"
const SidebarWidthSchema = z.coerce.number().min(SIDEBAR_MIN_WIDTH).max(SIDEBAR_MAX_WIDTH)

export type SidebarLayout = {
  readonly width: number
  readonly isCollapsed: boolean
  readonly collapse: () => void
  readonly expand: () => void
  readonly beginResize: (event: ReactPointerEvent<HTMLHRElement>) => void
  readonly resizeWithKeyboard: (event: ReactKeyboardEvent<HTMLHRElement>) => void
}

export function useSidebarLayout(): SidebarLayout {
  const [width, setWidth] = useState(() =>
    SidebarWidthSchema.catch(292).parse(localStorage.getItem(sidebarWidthKey)),
  )
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem(sidebarCollapsedKey) === "true",
  )

  function setCollapsed(collapsed: boolean): void {
    setIsCollapsed(collapsed)
    localStorage.setItem(sidebarCollapsedKey, String(collapsed))
  }

  function updateWidth(nextWidth: number): void {
    const constrainedWidth = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, nextWidth))
    setWidth(constrainedWidth)
    localStorage.setItem(sidebarWidthKey, String(constrainedWidth))
  }

  function beginResize(event: ReactPointerEvent<HTMLHRElement>): void {
    if (event.pointerType === "touch") {
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    const startX = event.clientX
    const startWidth = width

    function handlePointerMove(moveEvent: PointerEvent): void {
      const nextWidth = Math.min(
        SIDEBAR_MAX_WIDTH,
        Math.max(SIDEBAR_MIN_WIDTH, startWidth + moveEvent.clientX - startX),
      )
      setWidth(nextWidth)
    }

    function handlePointerUp(): void {
      setWidth((current) => {
        localStorage.setItem(sidebarWidthKey, String(current))
        return current
      })
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  return {
    width,
    isCollapsed,
    collapse: () => setCollapsed(true),
    expand: () => setCollapsed(false),
    beginResize,
    resizeWithKeyboard: (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return
      }
      event.preventDefault()
      updateWidth(width + (event.key === "ArrowLeft" ? -8 : 8))
    },
  }
}
