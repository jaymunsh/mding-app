// @vitest-environment happy-dom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { MutationOutcome } from "../app/workspaceActions"
import type { WorkspaceController } from "../app/workspaceController"
import { type NodeId, NodeIdSchema, NodeKind, type WorkspaceNode } from "../domain/workspace"
import { FileTree } from "./FileTree"
import { INTERNAL_DRAG_TYPE } from "./FileTreeRow"

const roots: Root[] = []

afterEach(() => {
  vi.useRealTimers()
  for (const root of roots.splice(0)) {
    act(() => root.unmount())
  }
  document.body.replaceChildren()
})

describe("FileTree internal drag movement feedback", () => {
  it("labels and persists a valid folder drop before showing a success toast", async () => {
    // Given
    let resolveMove: ((outcome: MutationOutcome) => void) | undefined
    const moveNodesToFolder = vi.fn<WorkspaceController["moveNodesToFolder"]>(
      () =>
        new Promise<MutationOutcome>((resolve) => {
          resolveMove = resolve
        }),
    )
    const folderNode = folder("Notes", null, 1)
    const fileNode = file("Draft.md", folderNode.id, 2)
    const container = renderTree(createWorkspace([folderNode, fileNode], { moveNodesToFolder }))
    const sourceRow = findRow(container, "Draft.md")
    const targetRow = findRow(container, "Notes")
    const dataTransfer = createDataTransfer([INTERNAL_DRAG_TYPE])

    // When
    dispatchDrag(sourceRow, "dragstart", dataTransfer)
    dispatchDrag(targetRow, "dragenter", dataTransfer)
    expect(targetRow.classList.contains("drag-target")).toBe(true)
    expect(targetRow.textContent).toContain("Move to folder: Notes")
    dispatchDrag(targetRow, "drop", dataTransfer)

    // Then
    expect(moveNodesToFolder).toHaveBeenCalledWith([fileNode.id], folderNode.id)
    expect(container.querySelector(".move-success-toast")).toBeNull()

    await act(async () => {
      resolveMove?.({ kind: "success" })
      await Promise.resolve()
    })
    expect(container.querySelector(".move-success-toast")?.textContent).toContain(
      "Moved to folder: Notes",
    )
  })

  it("labels and persists a valid root drop", async () => {
    // Given
    const folderNode = folder("Notes", null, 1)
    const fileNode = file("Draft.md", folderNode.id, 2)
    const moveNodesToRoot = vi.fn<WorkspaceController["moveNodesToRoot"]>(async () => ({
      kind: "success",
    }))
    const container = renderTree(createWorkspace([folderNode, fileNode], { moveNodesToRoot }))
    const sourceRow = findRow(container, "Draft.md")
    const rootTarget = () => container.querySelector(".tree-root-drop-target")
    const dataTransfer = createDataTransfer([INTERNAL_DRAG_TYPE])

    // When
    dispatchDrag(sourceRow, "dragstart", dataTransfer)
    const rootDropTarget = rootTarget()
    if (!(rootDropTarget instanceof HTMLElement)) {
      throw new Error("Missing root drop target")
    }
    dispatchDrag(rootDropTarget, "dragenter", dataTransfer)
    expect(rootDropTarget.classList.contains("root-drag-target")).toBe(true)
    expect(rootDropTarget.textContent).toContain("Move to root")
    await act(async () => {
      dispatchDrag(rootDropTarget, "drop", dataTransfer)
      await Promise.resolve()
    })

    // Then
    expect(moveNodesToRoot).toHaveBeenCalledWith([fileNode.id])
    expect(container.querySelector(".move-success-toast")?.textContent).toContain("Moved to root")
  })

  it("does not show a success toast when folder persistence fails", async () => {
    // Given
    const folderNode = folder("Notes", null, 1)
    const fileNode = file("Draft.md", folderNode.id, 2)
    const moveNodesToFolder = vi.fn<WorkspaceController["moveNodesToFolder"]>(async () => ({
      kind: "error",
      message: "Storage unavailable",
    }))
    const container = renderTree(createWorkspace([folderNode, fileNode], { moveNodesToFolder }))
    const sourceRow = findRow(container, "Draft.md")
    const targetRow = findRow(container, "Notes")
    const dataTransfer = createDataTransfer([INTERNAL_DRAG_TYPE])

    // When
    dispatchDrag(sourceRow, "dragstart", dataTransfer)
    dispatchDrag(targetRow, "dragenter", dataTransfer)
    await act(async () => {
      dispatchDrag(targetRow, "drop", dataTransfer)
      await Promise.resolve()
    })

    // Then
    expect(moveNodesToFolder).toHaveBeenCalledWith([fileNode.id], folderNode.id)
    expect(container.querySelector(".move-success-toast")).toBeNull()
  })

  it("expires the success toast after its transient interval", async () => {
    // Given
    vi.useFakeTimers()
    const folderNode = folder("Notes", null, 1)
    const fileNode = file("Draft.md", folderNode.id, 2)
    const moveNodesToRoot = vi.fn<WorkspaceController["moveNodesToRoot"]>(async () => ({
      kind: "success",
    }))
    const container = renderTree(createWorkspace([folderNode, fileNode], { moveNodesToRoot }))
    const dataTransfer = createDataTransfer([INTERNAL_DRAG_TYPE])

    // When
    dispatchDrag(findRow(container, "Draft.md"), "dragstart", dataTransfer)
    const rootTarget = container.querySelector(".tree-root-drop-target")
    if (!(rootTarget instanceof HTMLElement)) {
      throw new Error("Missing root drop target")
    }
    await act(async () => {
      dispatchDrag(rootTarget, "drop", dataTransfer)
      await Promise.resolve()
    })
    expect(container.querySelector(".move-success-toast")).not.toBeNull()

    // Then
    act(() => vi.advanceTimersByTime(2500))
    expect(container.querySelector(".move-success-toast")).toBeNull()
  })
})

function renderTree(workspace: WorkspaceController): HTMLElement {
  const container = document.createElement("div")
  document.body.append(container)
  const root = createRoot(container)
  roots.push(root)
  act(() =>
    root.render(<FileTree appLanguage="en" workspace={workspace} onCollapseSidebar={vi.fn()} />),
  )
  return container
}

function findRow(container: HTMLElement, name: string): HTMLButtonElement {
  const row = Array.from(container.querySelectorAll(".tree-row")).find((candidate) =>
    candidate.textContent?.includes(name),
  )
  if (!(row instanceof HTMLButtonElement)) {
    throw new Error(`Missing tree row: ${name}`)
  }
  return row
}

type TestDataTransfer = {
  readonly types: readonly string[]
  dropEffect: string
  effectAllowed: string
  readonly setData: (format: string, data: string) => void
}

function createDataTransfer(types: readonly string[]): TestDataTransfer {
  return {
    types,
    dropEffect: "none",
    effectAllowed: "all",
    setData: vi.fn(),
  }
}

function dispatchDrag(element: HTMLElement, type: string, dataTransfer: TestDataTransfer): Event {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, "dataTransfer", { value: dataTransfer })
  act(() => element.dispatchEvent(event))
  return event
}

function createWorkspace(
  nodes: readonly WorkspaceNode[],
  overrides: Partial<Pick<WorkspaceController, "moveNodesToRoot" | "moveNodesToFolder">> = {},
): WorkspaceController {
  return {
    nodes,
    selectedNode: null,
    selectedDocument: null,
    editBuffer: "",
    isEditing: false,
    isDirty: false,
    screen: "browser",
    errorMessage: null,
    storagePersisted: true,
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
    createFile: vi.fn(async () => ({ kind: "success" }) satisfies MutationOutcome),
    createFolder: vi.fn(async () => ({ kind: "success" }) satisfies MutationOutcome),
    renameSelected: vi.fn(async () => {}),
    deleteSelected: vi.fn(async () => {}),
    deleteNodes: vi.fn(async () => {}),
    dismissPendingDeletion: vi.fn(),
    undoPendingDeletion: vi.fn(async () => {}),
    setFilePinned: vi.fn(async () => ({ kind: "success" }) satisfies MutationOutcome),
    moveSelectedToRoot: vi.fn(async () => ({ kind: "success" }) satisfies MutationOutcome),
    moveSelectedToFolder: vi.fn(async () => ({ kind: "success" }) satisfies MutationOutcome),
    moveNodesToRoot:
      overrides.moveNodesToRoot ??
      vi.fn(async () => ({ kind: "success" }) satisfies MutationOutcome),
    moveNodesToFolder:
      overrides.moveNodesToFolder ??
      vi.fn(async () => ({ kind: "success" }) satisfies MutationOutcome),
    importDocumentFiles: vi.fn(async () => {}),
    importWorkspaceFile: vi.fn(async () => {}),
    exportSelectedDocument: vi.fn(),
    exportWorkspace: vi.fn(async () => {}),
    setDocumentReadingProgress: vi.fn(),
    clearError: vi.fn(),
  }
}

function file(name: string, parentId: NodeId | null, seed: number): WorkspaceNode {
  return {
    id: nodeId(seed),
    parentId,
    kind: NodeKind.File,
    name,
    createdAt: seed,
    updatedAt: seed,
  }
}

function folder(name: string, parentId: NodeId | null, seed: number): WorkspaceNode {
  return {
    id: nodeId(seed),
    parentId,
    kind: NodeKind.Folder,
    name,
    createdAt: seed,
    updatedAt: seed,
  }
}

function nodeId(seed: number): NodeId {
  return NodeIdSchema.parse(`00000000-0000-4000-8000-${seed.toString().padStart(12, "0")}`)
}
