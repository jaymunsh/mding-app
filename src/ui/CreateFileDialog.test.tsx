// @vitest-environment happy-dom

import { act, createRef } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CreateFileDialog } from "./CreateFileDialog"

const roots: Root[] = []

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => root.unmount())
  }
  document.body.replaceChildren()
})

describe("shared create name dialog", () => {
  it("renders a named folder form without the Markdown extension hint", () => {
    const onCreate = vi.fn()
    const container = renderDialog({ kind: "folder", name: "Notes", onCreate })

    expect(container.querySelector("h2")?.textContent).toBe("New folder")
    expect(container.querySelector("label")?.textContent).toBe("Folder name")
    expect(container.querySelector("#new-folder-name")).not.toBeNull()
    expect(container.textContent).not.toContain(".md is added automatically")

    const submit = container.querySelector("button[type=submit]")
    expect(submit).not.toBeNull()
    if (!(submit instanceof HTMLButtonElement)) {
      return
    }
    act(() => submit.click())
    expect(onCreate).toHaveBeenCalledTimes(1)
  })

  it("accepts an extensionless Markdown name but rejects other extensions and paths", () => {
    const extensionless = renderDialog({ kind: "file", name: "Notes" })
    expect(extensionless.querySelector("button[type=submit]")).toHaveProperty("disabled", false)

    const arbitraryFormat = renderDialog({ kind: "file", name: "Notes.html" })
    expect(arbitraryFormat.querySelector("button[type=submit]")).toHaveProperty("disabled", true)

    const path = renderDialog({ kind: "folder", name: "Notes/Archive" })
    expect(path.querySelector("button[type=submit]")).toHaveProperty("disabled", true)
  })

  it("rejects a blank or whitespace-only name without invoking creation", () => {
    const onCreate = vi.fn()
    const container = renderDialog({ kind: "folder", name: " \t\n", onCreate })
    const submit = container.querySelector("button[type=submit]")

    expect(submit).toHaveProperty("disabled", true)
    if (!(submit instanceof HTMLButtonElement)) {
      return
    }
    act(() => submit.click())
    expect(onCreate).not.toHaveBeenCalled()
  })
})

type DialogOverrides = {
  readonly kind?: "file" | "folder"
  readonly name?: string
  readonly onCreate?: () => void
}

function renderDialog(overrides: DialogOverrides = {}): HTMLElement {
  const container = document.createElement("div")
  document.body.append(container)
  const root = createRoot(container)
  roots.push(root)
  const inputRef = createRef<HTMLInputElement>()

  act(() => {
    root.render(
      <CreateFileDialog
        appLanguage="en"
        inputRef={inputRef}
        kind={overrides.kind ?? "file"}
        name={overrides.name ?? "Untitled.md"}
        onNameChange={vi.fn()}
        onCancel={vi.fn()}
        onCreate={overrides.onCreate ?? vi.fn()}
      />,
    )
  })

  return container
}
