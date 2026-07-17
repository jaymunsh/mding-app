// @vitest-environment happy-dom

import { act, useState } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import { APP_VERSION } from "../app/appVersion"
import { UpdateHistoryDialog } from "./UpdateHistoryDialog"

const roots: Root[] = []

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => root.unmount())
  }
  document.body.replaceChildren()
})

describe("UpdateHistoryDialog", () => {
  it("renders bundled English release notes for the current version", () => {
    const container = renderDialog("en")

    expect(container.textContent).toContain(APP_VERSION)
    expect(container.textContent).toContain("Latest release")
    expect(container.querySelectorAll(".update-history-release").length).toBeGreaterThan(1)
  })

  it("renders the dialog chrome and notes in Korean", () => {
    const container = renderDialog("ko")

    expect(container.querySelector("h2")?.textContent).toBe("업데이트 기록")
    expect(container.textContent).toContain("최신 릴리스")
    expect(container.textContent).toContain("고정 바로가기")
  })

  it("closes when Escape is pressed", () => {
    const onClose = vi.fn()
    const container = renderDialog("en", onClose)
    const dialog = container.querySelector('[role="dialog"]')

    expect(dialog).not.toBeNull()
    if (dialog === null) {
      return
    }

    act(() => {
      dialog.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }))
    })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("moves focus to the close button when it opens", () => {
    const container = renderDialog("en")
    const closeButton = container.querySelector<HTMLButtonElement>(
      '.update-history-dialog button[aria-label="Close update history"]',
    )

    expect(closeButton).not.toBeNull()
    expect(document.activeElement).toBe(closeButton)
  })

  it("returns focus to the exact update-history trigger after closing", () => {
    const { container, trigger } = renderDialogFromUpdateHistoryTrigger()

    const closeButton = container.querySelector<HTMLButtonElement>(
      '.update-history-dialog button[aria-label="Close update history"]',
    )
    expect(closeButton).not.toBeNull()
    if (closeButton === null) {
      return
    }

    act(() => closeButton.click())

    expect(document.activeElement).toBe(trigger)
  })
})

function renderDialog(appLanguage: "en" | "ko", onClose: () => void = vi.fn()): HTMLElement {
  const container = document.createElement("div")
  document.body.append(container)
  const root = createRoot(container)
  roots.push(root)
  act(() => root.render(<UpdateHistoryDialog appLanguage={appLanguage} onClose={onClose} />))
  return container
}

function renderDialogFromUpdateHistoryTrigger(): {
  readonly container: HTMLElement
  readonly trigger: HTMLButtonElement
} {
  const container = document.createElement("div")
  document.body.append(container)
  const root = createRoot(container)
  roots.push(root)
  act(() => root.render(<DialogFromUpdateHistoryTrigger />))

  const trigger = container.querySelector<HTMLButtonElement>('button[aria-label="Update history"]')
  if (trigger === null) {
    throw new Error("Missing update history trigger")
  }

  act(() => {
    trigger.focus()
    trigger.click()
  })
  return { container, trigger }
}

function DialogFromUpdateHistoryTrigger() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button type="button" aria-label="Update history" onClick={() => setIsOpen(true)}>
        Update history
      </button>
      {isOpen ? <UpdateHistoryDialog appLanguage="en" onClose={() => setIsOpen(false)} /> : null}
    </>
  )
}
