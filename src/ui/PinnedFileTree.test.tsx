// @vitest-environment happy-dom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { WorkspaceController } from "../app/workspaceController"
import { createNodeId, NodeKind, type WorkspaceNode } from "../domain/workspace"
import { FileTree } from "./FileTree"

const roots: Root[] = []

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => root.unmount())
  }
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
})

describe("FileTree pinned shortcuts", () => {
  it("renders a localized pinned section only when pins exist and keeps originals in the tree", () => {
    // Given
    const folder = node(NodeKind.Folder, "Notes", null, 1)
    const pinnedChild = node(NodeKind.File, "Zeta.md", folder.id, 10, true)
    const pinnedRoot = node(NodeKind.File, "Alpha.md", null, 20, true)
    const unpinnedRoot = node(NodeKind.File, "Readme.md", null, 30)
    const workspace = createWorkspace([folder, pinnedChild, pinnedRoot, unpinnedRoot])

    // When
    const container = renderTree(workspace, "ko")

    // Then
    expect(container.querySelector(".pinned-section")?.textContent).toContain("고정됨")
    expect(rowNames(container, ".pinned-section")).toEqual(["Alpha.md", "Zeta.md"])
    expect(rowNames(container, ".workspace-tree-section")).toEqual([
      "Notes",
      "Readme.md",
      "Alpha.md",
    ])
    expect(
      container.querySelector(`.workspace-tree-section [data-node-id="${pinnedChild.id}"]`),
    ).not.toBeNull()
    expect(container.querySelector(".folder-row .tree-row-pin-control")).toBeNull()
  })

  it("reorders pinned shortcuts and original files when the shared sort control changes", () => {
    // Given
    const first = node(NodeKind.File, "Zeta.md", null, 30, true)
    const second = node(NodeKind.File, "Alpha.md", null, 10, true)
    const workspace = createWorkspace([first, second])
    const container = renderTree(workspace, "en")

    // When
    const sortTrigger = container.querySelector(".sort-trigger")
    if (!(sortTrigger instanceof HTMLButtonElement)) {
      throw new Error("Missing tree sort control")
    }
    act(() => sortTrigger.click())

    // Then
    expect(rowNames(container, ".pinned-section")).toEqual(["Alpha.md", "Zeta.md"])
    expect(rowNames(container, ".workspace-tree-section")).toEqual(["Alpha.md", "Zeta.md"])
  })

  it("uses a file-only contextual control for pinning and opens shortcut rows", async () => {
    // Given
    const folder = node(NodeKind.Folder, "Notes", null, 1)
    const fileNode = node(NodeKind.File, "Draft.md", folder.id, 2)
    const pinnedNode = node(NodeKind.File, "Pinned.md", null, 3, true)
    const workspace = createWorkspace([folder, fileNode, pinnedNode])
    const container = renderTree(workspace, "en")
    const fileRow = container.querySelector(`.tree-row[data-node-id="${fileNode.id}"]`)
    const pinButton = fileRow?.parentElement?.querySelector(".tree-row-pin-control")
    if (!(pinButton instanceof HTMLButtonElement)) {
      throw new Error("Missing file pin control")
    }

    // When
    await act(async () => {
      pinButton.click()
      await Promise.resolve()
    })
    const shortcut = container.querySelector(
      `.pinned-section .tree-row[data-node-id="${pinnedNode.id}"]`,
    )
    if (!(shortcut instanceof HTMLButtonElement)) {
      throw new Error("Missing pinned shortcut row")
    }
    act(() => shortcut.click())

    // Then
    expect(workspace.setFilePinned).toHaveBeenCalledWith(fileNode.id, true)
    expect(workspace.selectNode).toHaveBeenCalledWith(pinnedNode.id)
    expect(workspace.setFilePinned).not.toHaveBeenCalledWith(folder.id, true)
    expect(workspace.setFilePinned).not.toHaveBeenCalledWith(pinnedNode.id, true)
  })

  it("does not render the shortcut section when no file is pinned", () => {
    // Given
    const workspace = createWorkspace([node(NodeKind.File, "Readme.md", null, 1)])

    // When
    const container = renderTree(workspace, "en")

    // Then
    expect(container.querySelector(".pinned-section")).toBeNull()
  })
})

function renderTree(workspace: WorkspaceController, appLanguage: "en" | "ko"): HTMLElement {
  const container = document.createElement("div")
  document.body.append(container)
  const root = createRoot(container)
  roots.push(root)
  act(() => {
    root.render(
      <FileTree appLanguage={appLanguage} workspace={workspace} onCollapseSidebar={vi.fn()} />,
    )
  })
  return container
}

function rowNames(container: HTMLElement, sectionSelector: string): string[] {
  return Array.from(
    container.querySelectorAll(`${sectionSelector} > .tree-node > .tree-row-shell`),
  ).map((shell) => shell.querySelector(".tree-row-name")?.textContent ?? "")
}

function createWorkspace(nodes: readonly WorkspaceNode[]): WorkspaceController {
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
    createFile: vi.fn(async () => ({ kind: "success" as const })),
    createFolder: vi.fn(async () => ({ kind: "success" as const })),
    renameSelected: vi.fn(async () => {}),
    deleteSelected: vi.fn(async () => {}),
    deleteNodes: vi.fn(async () => {}),
    dismissPendingDeletion: vi.fn(),
    undoPendingDeletion: vi.fn(async () => {}),
    moveSelectedToRoot: vi.fn(async () => ({ kind: "success" as const })),
    moveSelectedToFolder: vi.fn(async () => ({ kind: "success" as const })),
    moveNodesToRoot: vi.fn(async () => ({ kind: "success" as const })),
    moveNodesToFolder: vi.fn(async () => ({ kind: "success" as const })),
    setFilePinned: vi.fn(async () => ({ kind: "success" as const })),
    importDocumentFiles: vi.fn(async () => {}),
    importWorkspaceFile: vi.fn(async () => {}),
    exportSelectedDocument: vi.fn(),
    exportWorkspace: vi.fn(async () => {}),
    setDocumentReadingProgress: vi.fn(),
    clearError: vi.fn(),
  }
}

function node(
  kind: NodeKind,
  name: string,
  parentId: WorkspaceNode["parentId"],
  updatedAt: number,
  pinned = false,
): WorkspaceNode {
  if (kind === NodeKind.Folder) {
    return {
      id: createNodeId(),
      parentId,
      kind,
      name,
      createdAt: updatedAt,
      updatedAt,
    }
  }
  return {
    id: createNodeId(),
    parentId,
    kind,
    name,
    createdAt: updatedAt,
    updatedAt,
    pinned,
  }
}
