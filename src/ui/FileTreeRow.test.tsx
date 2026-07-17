// @vitest-environment happy-dom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { MutationOutcome } from "../app/workspaceActions"
import type { WorkspaceController } from "../app/workspaceController"
import {
  type NodeId,
  NodeIdSchema,
  NodeKind,
  type TreeNode,
  type WorkspaceNode,
} from "../domain/workspace"
import { FileTreeRow, type FileTreeRowContext, INTERNAL_DRAG_TYPE } from "./FileTreeRow"

const roots: Root[] = []

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => root.unmount())
  }
  document.body.replaceChildren()
})

describe("FileTreeRow internal drag movement", () => {
  it("labels a valid folder destination and reports success only after persistence succeeds", async () => {
    // Given
    const source = file("Draft.md", null, 1)
    const target = folder("Notes", null, 2)
    const moveNodesToFolder = vi.fn<WorkspaceController["moveNodesToFolder"]>(async () => ({
      kind: "success",
    }))
    const onMoveSuccess = vi.fn()
    const onMoveDone = vi.fn()
    const container = renderRow(
      treeNode(target),
      createContext({
        workspace: createWorkspace([source, target], { moveNodesToFolder }),
        draggedNodeIds: [source.id],
        draggedTreeNodes: [treeNode(source)],
        dragTargetId: target.id,
        onMoveDone,
        onMoveSuccess,
      }),
    )

    // When
    const row = findRow(container)
    expect(row.textContent).toContain("Move to folder: Notes")
    await act(async () => {
      dispatchDrag(row, "drop", createDataTransfer([INTERNAL_DRAG_TYPE]))
      await Promise.resolve()
    })

    // Then
    expect(moveNodesToFolder).toHaveBeenCalledWith([source.id], target.id)
    expect(onMoveSuccess).toHaveBeenCalledWith({ kind: "folder", name: "Notes" })
    expect(onMoveDone).toHaveBeenCalledTimes(1)
  })

  it("does not move or report success when the drop lands on a file row", async () => {
    // Given
    const source = file("Draft.md", null, 1)
    const fileTarget = file("Readme.md", null, 2)
    const moveNodesToFolder = vi.fn<WorkspaceController["moveNodesToFolder"]>(async () => ({
      kind: "success",
    }))
    const onMoveSuccess = vi.fn()
    const container = renderRow(
      treeNode(fileTarget),
      createContext({
        workspace: createWorkspace([source, fileTarget], { moveNodesToFolder }),
        draggedNodeIds: [source.id],
        draggedTreeNodes: [treeNode(source)],
        onMoveSuccess,
      }),
    )

    // When
    await act(async () => {
      dispatchDrag(findRow(container), "drop", createDataTransfer([INTERNAL_DRAG_TYPE]))
      await Promise.resolve()
    })

    // Then
    expect(moveNodesToFolder).not.toHaveBeenCalled()
    expect(onMoveSuccess).not.toHaveBeenCalled()
  })

  it("does not move or report success when the destination is inside the dragged folder", async () => {
    // Given
    const source = folder("Notes", null, 1)
    const descendant = folder("Drafts", source.id, 2)
    const moveNodesToFolder = vi.fn<WorkspaceController["moveNodesToFolder"]>(async () => ({
      kind: "success",
    }))
    const onMoveSuccess = vi.fn()
    const container = renderRow(
      treeNode(descendant),
      createContext({
        workspace: createWorkspace([source, descendant], { moveNodesToFolder }),
        draggedNodeIds: [source.id],
        draggedTreeNodes: [treeNode(source, [treeNode(descendant)])],
        onMoveSuccess,
      }),
    )

    // When
    await act(async () => {
      dispatchDrag(findRow(container), "drop", createDataTransfer([INTERNAL_DRAG_TYPE]))
      await Promise.resolve()
    })

    // Then
    expect(moveNodesToFolder).not.toHaveBeenCalled()
    expect(onMoveSuccess).not.toHaveBeenCalled()
  })

  it("does not report success when folder persistence fails", async () => {
    // Given
    const source = file("Draft.md", null, 1)
    const target = folder("Notes", null, 2)
    const moveNodesToFolder = vi.fn<WorkspaceController["moveNodesToFolder"]>(async () => ({
      kind: "error",
      message: "Storage unavailable",
    }))
    const onMoveSuccess = vi.fn()
    const container = renderRow(
      treeNode(target),
      createContext({
        workspace: createWorkspace([source, target], { moveNodesToFolder }),
        draggedNodeIds: [source.id],
        draggedTreeNodes: [treeNode(source)],
        onMoveSuccess,
      }),
    )

    // When
    await act(async () => {
      dispatchDrag(findRow(container), "drop", createDataTransfer([INTERNAL_DRAG_TYPE]))
      await Promise.resolve()
    })

    // Then
    expect(moveNodesToFolder).toHaveBeenCalledWith([source.id], target.id)
    expect(onMoveSuccess).not.toHaveBeenCalled()
  })

  it("leaves external file drops available to the app-level importer", () => {
    // Given
    const source = file("Draft.md", null, 1)
    const target = folder("Notes", null, 2)
    const onExternalDrop = vi.fn()
    const container = document.createElement("div")
    document.body.append(container)
    const root = createRoot(container)
    roots.push(root)
    const context = createContext({
      workspace: createWorkspace([source, target]),
      draggedNodeIds: [source.id],
      draggedTreeNodes: [treeNode(source)],
    })

    act(() => {
      root.render(
        <section role="region" onDrop={onExternalDrop}>
          <FileTreeRow node={treeNode(target)} depth={0} context={context} />
        </section>,
      )
    })

    // When
    const event = dispatchDrag(findRow(container), "drop", createDataTransfer(["Files"]))

    // Then
    expect(event.defaultPrevented).toBe(false)
    expect(onExternalDrop).toHaveBeenCalledTimes(1)
    expect(context.workspace.moveNodesToFolder).not.toHaveBeenCalled()
  })
})

type ContextOverrides = Partial<
  Pick<
    FileTreeRowContext,
    | "workspace"
    | "draggedNodeIds"
    | "draggedTreeNodes"
    | "dragTargetId"
    | "onMoveDone"
    | "onMoveSuccess"
  >
>

function createContext(overrides: ContextOverrides = {}): FileTreeRowContext {
  return {
    appLanguage: "en",
    workspace: overrides.workspace ?? createWorkspace([]),
    isManaging: false,
    isChoosingMoveTarget: false,
    managedSelectionIds: [],
    managedSelectedTreeNodes: [],
    draggedNodeIds: overrides.draggedNodeIds ?? [],
    draggedTreeNodes: overrides.draggedTreeNodes ?? [],
    dragTargetId: overrides.dragTargetId ?? null,
    onToggleManagedSelection: vi.fn(),
    onMoveDone: overrides.onMoveDone ?? vi.fn(),
    onMoveSuccess: overrides.onMoveSuccess ?? vi.fn(),
    onManageSelectionChange: vi.fn(),
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
    onDragTargetChange: vi.fn(),
  }
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

function renderRow(node: TreeNode, context: FileTreeRowContext): HTMLElement {
  const container = document.createElement("div")
  document.body.append(container)
  const root = createRoot(container)
  roots.push(root)
  act(() => root.render(<FileTreeRow node={node} depth={0} context={context} />))
  return container
}

function findRow(container: HTMLElement): HTMLButtonElement {
  const row = container.querySelector(".tree-row")
  if (!(row instanceof HTMLButtonElement)) {
    throw new Error("Missing tree row")
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

function treeNode(node: WorkspaceNode, children: readonly TreeNode[] = []): TreeNode {
  return { ...node, children }
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
