// @vitest-environment happy-dom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { APP_VERSION } from "../app/appVersion"
import { LAST_SEEN_VERSION_STORAGE_KEY } from "../app/updateHistory"
import type { WorkspaceController } from "../app/workspaceController"
import { App } from "./App"

const mocks = vi.hoisted(
  () =>
    ({
      workspace: {
        nodes: [],
        selectedNode: null,
        selectedDocument: null,
        editBuffer: "",
        isEditing: false,
        isDirty: false,
        screen: "browser",
        errorMessage: null,
        storagePersisted: false,
        lastBackupAt: null,
        pendingDeletionCount: 0,
        readingProgress: {},
        selectNode: vi.fn(async () => {}),
        selectNodeInTree: vi.fn(async () => {}),
        showBrowser: vi.fn(),
        startEditing: vi.fn(),
        cancelEditing: vi.fn(),
        updateEditBuffer: vi.fn(),
        saveSelectedDocument: vi.fn(async () => {}),
        createFile: vi.fn<WorkspaceController["createFile"]>(async () => ({ kind: "success" })),
        createFolder: vi.fn<WorkspaceController["createFolder"]>(async () => ({ kind: "success" })),
        renameSelected: vi.fn(async () => {}),
        deleteSelected: vi.fn(async () => {}),
        deleteNodes: vi.fn(async () => {}),
        dismissPendingDeletion: vi.fn(),
        undoPendingDeletion: vi.fn(async () => {}),
        moveSelectedToRoot: vi.fn<WorkspaceController["moveSelectedToRoot"]>(async () => ({
          kind: "success",
        })),
        moveSelectedToFolder: vi.fn<WorkspaceController["moveSelectedToFolder"]>(async () => ({
          kind: "success",
        })),
        moveNodesToRoot: vi.fn<WorkspaceController["moveNodesToRoot"]>(async () => ({
          kind: "success",
        })),
        moveNodesToFolder: vi.fn<WorkspaceController["moveNodesToFolder"]>(async () => ({
          kind: "success",
        })),
        setFilePinned: vi.fn(async () => ({ kind: "success" as const })),
        importDocumentFiles: vi.fn(async () => {}),
        importWorkspaceFile: vi.fn(async () => {}),
        exportSelectedDocument: vi.fn(),
        exportWorkspace: vi.fn(async () => {}),
        setDocumentReadingProgress: vi.fn(),
        clearError: vi.fn(),
      },
      sidebar: {
        width: 280,
        isCollapsed: false,
        collapse: vi.fn(),
        expand: vi.fn(),
        beginResize: vi.fn(),
        resizeWithKeyboard: vi.fn(),
      },
    }) satisfies { readonly workspace: WorkspaceController; readonly sidebar: object },
)

vi.mock("../app/workspaceController", () => ({
  useWorkspaceController: () => mocks.workspace,
}))
vi.mock("./DocumentPane", () => ({ DocumentPane: () => null }))
vi.mock("./FileTree", () => ({ FileTree: () => null }))
vi.mock("./HelpDialog", () => ({ HelpDialog: () => null }))
vi.mock("./UndoToast", () => ({ UndoToast: () => null }))
vi.mock("./UpdateHistoryDialog", () => ({
  UpdateHistoryDialog: ({ onClose }: { readonly onClose: () => void }) => (
    <div role="dialog" aria-label="release-notes-test">
      <button type="button" onClick={onClose}>
        Close release notes
      </button>
    </div>
  ),
}))
vi.mock("./useSidebarLayout", () => ({
  useSidebarLayout: () => mocks.sidebar,
}))

const roots: Root[] = []

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
  localStorage.clear()
})

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => root.unmount())
  }
  document.body.replaceChildren()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe("App creation actions", () => {
  it("opens the shared name dialog from both topbar actions", () => {
    const container = renderApp()
    const folderAction = findButton(container, "Folder")
    const fileAction = findButton(container, "File")

    act(() => folderAction.click())
    expect(container.querySelector("h2")?.textContent).toBe("New folder")
    closeDialog(container)

    act(() => fileAction.click())
    expect(container.querySelector("h2")?.textContent).toBe("New Markdown file")
    expect(container.querySelector("#new-file-name")).not.toBeNull()
  })

  it("passes a folder name to creation without scheduling an asynchronous rename", async () => {
    const container = renderApp()
    const folderAction = findButton(container, "Folder")

    act(() => folderAction.click())
    const folderInput = container.querySelector("#new-folder-name")
    expect(folderInput).toBeInstanceOf(HTMLInputElement)
    if (!(folderInput instanceof HTMLInputElement)) {
      return
    }

    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
      expect(valueSetter).toBeDefined()
      if (valueSetter === undefined) {
        return
      }
      valueSetter.call(folderInput, "Project")
      folderInput.dispatchEvent(new Event("input", { bubbles: true }))
      const submit = container.querySelector("button[type=submit]")
      expect(submit).toBeInstanceOf(HTMLButtonElement)
      if (submit instanceof HTMLButtonElement) {
        submit.click()
      }
      await Promise.resolve()
    })

    expect(mocks.workspace.createFolder).toHaveBeenCalledWith("Project")
    expect(mocks.workspace.renameSelected).not.toHaveBeenCalled()
  })

  it("keeps the create dialog open when repository-backed creation reports an error", async () => {
    // Given
    mocks.workspace.createFolder.mockResolvedValue({
      kind: "error",
      message: "Storage unavailable",
    })
    const container = renderApp()
    const folderAction = findButton(container, "Folder")
    act(() => folderAction.click())

    const folderInput = container.querySelector("#new-folder-name")
    if (!(folderInput instanceof HTMLInputElement)) {
      throw new Error("Missing folder name input")
    }

    // When
    await act(async () => {
      setInputValue(folderInput, "Project")
      const submit = container.querySelector("button[type=submit]")
      if (!(submit instanceof HTMLButtonElement)) {
        throw new Error("Missing create submit button")
      }
      submit.click()
      await Promise.resolve()
    })

    // Then
    expect(mocks.workspace.createFolder).toHaveBeenCalledWith("Project")
    expect(mocks.workspace.showBrowser).not.toHaveBeenCalled()
    expect(container.querySelector("[role=dialog]")).not.toBeNull()
  })
})

describe("App update history", () => {
  it("marks the current release seen when update history opens", () => {
    const container = renderApp()

    act(() => findButton(container, "Settings").click())
    const updateHistory = findButton(container, "Update history")
    expect(updateHistory.querySelector(".settings-update-badge")).not.toBeNull()

    act(() => updateHistory.click())

    expect(container.querySelector('[aria-label="release-notes-test"]')).not.toBeNull()
    expect(localStorage.getItem(LAST_SEEN_VERSION_STORAGE_KEY)).toBe(APP_VERSION)
  })

  it("keeps a previously seen release unbadged", () => {
    localStorage.setItem(LAST_SEEN_VERSION_STORAGE_KEY, APP_VERSION)
    const container = renderApp()

    act(() => findButton(container, "Settings").click())

    expect(
      findButton(container, "Update history").querySelector(".settings-update-badge"),
    ).toBeNull()
  })

  it("reopens Settings and restores focus to a new trigger after history closes", async () => {
    // Given
    const container = renderApp()
    act(() => findButton(container, "Settings").click())
    const originalTrigger = findButton(container, "Update history")

    // When
    act(() => {
      originalTrigger.focus()
      originalTrigger.click()
    })

    // Then
    expect(originalTrigger.isConnected).toBe(false)
    expect(container.querySelectorAll('[role="dialog"]').length).toBe(1)

    const closeHistory = container.querySelector<HTMLButtonElement>(
      '[aria-label="release-notes-test"] button',
    )
    if (closeHistory === null) {
      throw new Error("Missing update history close button")
    }

    // When
    act(() => closeHistory.click())
    await act(async () => {
      await Promise.resolve()
    })

    // Then
    const restoredTrigger = findButton(container, "Update history")
    expect(restoredTrigger).not.toBe(originalTrigger)
    expect(findButton(container, "Settings").getAttribute("aria-expanded")).toBe("true")
    expect(container.querySelectorAll('[role="dialog"]').length).toBe(1)
    expect(document.activeElement).toBe(restoredTrigger)
  })
})

function renderApp(): HTMLElement {
  const container = document.createElement("div")
  document.body.append(container)
  const root = createRoot(container)
  roots.push(root)
  act(() => root.render(<App />))
  return container
}

function findButton(container: HTMLElement, label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.getAttribute("aria-label") === label,
  )
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Missing button: ${label}`)
  }
  return button
}

function closeDialog(container: HTMLElement): void {
  const cancel = container.querySelector(".name-dialog-actions button[type=button]")
  if (!(cancel instanceof HTMLButtonElement)) {
    throw new Error("Missing dialog cancel button")
  }
  act(() => cancel.click())
}

function setInputValue(input: HTMLInputElement, value: string): void {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
  if (valueSetter === undefined) {
    throw new Error("Missing input value setter")
  }
  valueSetter.call(input, value)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}
