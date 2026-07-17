import { afterEach, describe, expect, it, vi } from "vitest"
import { getFolderTarget, uniqueName } from "../domain/tree"
import {
  createNodeId,
  DocumentFormat,
  NodeKind,
  type WorkspaceDocument,
  type WorkspaceNode,
} from "../domain/workspace"
import type { WorkspaceItemToCreate, WorkspaceRepository } from "../storage/workspaceRepository"
import { createItem, moveNodes, setFilePinned } from "./workspaceActions"
import { deleteNodes, restoreDeletedSnapshot } from "./workspaceDeleteActions"
import { renameSelected } from "./workspaceRenameActions"
import { type ControllerState, initialState, type StateSetter } from "./workspaceState"

describe("workspace actions", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("moves multiple selected nodes to a folder", async () => {
    vi.setSystemTime(new Date("2026-07-03T00:00:00.000Z"))
    const folder = node(NodeKind.Folder, "Notes", null)
    const first = node(NodeKind.File, "Today.md", null)
    const second = node(NodeKind.File, "Tomorrow.md", null)
    const repository = createMemoryRepository([folder, first, second])
    let state: ControllerState = { ...initialState, nodes: [folder, first, second] }
    const setState: StateSetter = (update) => {
      state = typeof update === "function" ? update(state) : update
    }

    const outcome = await moveNodes({
      repository,
      setState,
      selectedIds: [first.id, second.id],
      parentId: folder.id,
    })

    expect(outcome).toEqual({ kind: "success" })
    expect(state.errorMessage).toBeNull()
    expect(state.nodes).toEqual([
      folder,
      { ...first, parentId: folder.id, updatedAt: Date.now() },
      { ...second, parentId: folder.id, updatedAt: Date.now() },
    ])
  })

  it("persists a pin on a file without changing its folder location", async () => {
    // Given
    const folder = node(NodeKind.Folder, "Notes", null)
    const file = node(NodeKind.File, "Draft.md", folder.id)
    const repository = createMemoryRepository([folder, file])
    let state: ControllerState = { ...initialState, nodes: [folder, file] }
    const setState: StateSetter = (update) => {
      state = typeof update === "function" ? update(state) : update
    }

    // When
    const outcome = await setFilePinned({
      repository,
      setState,
      id: file.id,
      pinned: true,
    })

    // Then
    expect(outcome).toEqual({ kind: "success" })
    expect(state.nodes).toContainEqual({ ...file, pinned: true })
    expect(state.nodes.find((item) => item.id === file.id)?.parentId).toBe(folder.id)
  })

  it("returns a no-op outcome and preserves the existing error for an empty move", async () => {
    // Given
    const repository = createMemoryRepository([])
    let state: ControllerState = initialState
    const setState: StateSetter = (update) => {
      state = typeof update === "function" ? update(state) : update
    }

    // When
    const outcome = await moveNodes({
      repository,
      setState,
      selectedIds: [],
      parentId: null,
    })

    // Then
    expect(outcome).toEqual({ kind: "no-op", message: "Choose a file or folder first." })
    expect(state.errorMessage).toBe("Choose a file or folder first.")
    expect(state.nodes).toEqual([])
  })

  it("returns an error outcome and preserves state when atomic creation rejects", async () => {
    // Given
    const folder = node(NodeKind.Folder, "Notes", null)
    const repository = {
      ...createMemoryRepository([folder]),
      createItem: async () => {
        throw new Error("Storage unavailable")
      },
    } satisfies WorkspaceRepository
    let state: ControllerState = { ...initialState, nodes: [folder], selectedId: folder.id }
    const setState: StateSetter = (update) => {
      state = typeof update === "function" ? update(state) : update
    }

    // When
    const outcome = await createItem({
      repository,
      setState,
      selectedId: folder.id,
      kind: NodeKind.File,
      name: "Draft",
    })

    // Then
    expect(outcome).toEqual({ kind: "error", message: "Storage unavailable" })
    expect(state.nodes).toEqual([folder])
    expect(state.selectedId).toBe(folder.id)
    expect(state.errorMessage).toBe("Storage unavailable")
    expect(state.screen).toBe("browser")
  })

  it("returns an error outcome and leaves the tree unchanged when a move write rejects", async () => {
    // Given
    const folder = node(NodeKind.Folder, "Notes", null)
    const file = node(NodeKind.File, "Draft.md", null)
    const repository = {
      ...createMemoryRepository([folder, file]),
      saveNode: async () => {
        throw new Error("Storage unavailable")
      },
    } satisfies WorkspaceRepository
    let state: ControllerState = { ...initialState, nodes: [folder, file] }
    const setState: StateSetter = (update) => {
      state = typeof update === "function" ? update(state) : update
    }

    // When
    const outcome = await moveNodes({
      repository,
      setState,
      selectedIds: [file.id],
      parentId: folder.id,
    })

    // Then
    expect(outcome).toEqual({ kind: "error", message: "Storage unavailable" })
    expect(state.nodes).toEqual([folder, file])
    expect(state.errorMessage).toBe("Storage unavailable")
  })

  it("creates a trimmed Markdown file in the selected folder with a unique name and edit state", async () => {
    const folder = node(NodeKind.Folder, "Notes", null)
    const existing = node(NodeKind.File, "Meeting.md", folder.id)
    const repository = createMemoryRepository([folder, existing])
    let state: ControllerState = {
      ...initialState,
      nodes: [folder, existing],
      selectedId: folder.id,
    }
    const setState: StateSetter = (update) => {
      state = typeof update === "function" ? update(state) : update
    }

    const outcome = await createItem({
      repository,
      setState,
      selectedId: state.selectedId,
      kind: NodeKind.File,
      name: "  Meeting  ",
    })

    expect(outcome).toEqual({ kind: "success" })
    const created = state.nodes.find((item) => item.id === state.selectedId)
    expect(created).toBeDefined()
    if (created === undefined) {
      return
    }
    expect(created).toMatchObject({
      parentId: folder.id,
      kind: NodeKind.File,
      name: "Meeting 2.md",
    })
    expect(state.selectedDocument).toMatchObject({
      id: created.id,
      format: DocumentFormat.Markdown,
    })
    expect(state.isEditing).toBe(true)
    expect(state.screen).toBe("document")
  })

  it("creates a named folder with a collision-safe name in the selected folder", async () => {
    const parent = node(NodeKind.Folder, "Workspace", null)
    const existing = node(NodeKind.Folder, "Project", parent.id)
    const savedNodes: WorkspaceNode[] = []
    const repository = createMemoryRepository([parent, existing], [], savedNodes)
    let state: ControllerState = {
      ...initialState,
      nodes: [parent, existing],
      selectedId: parent.id,
    }
    const setState: StateSetter = (update) => {
      state = typeof update === "function" ? update(state) : update
    }

    await createItem({
      repository,
      setState,
      selectedId: state.selectedId,
      kind: NodeKind.Folder,
      name: "Project",
    })

    expect(savedNodes).toEqual([
      expect.objectContaining({
        parentId: parent.id,
        kind: NodeKind.Folder,
        name: "Project 2",
      }),
    ])
    expect(state.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          parentId: parent.id,
          kind: NodeKind.Folder,
          name: "Project 2",
        }),
      ]),
    )
    expect(state.nodes.some((item) => item.name === "Folder")).toBe(false)
    expect(state.screen).toBe("browser")
  })

  it("creates concurrent same-named folders with distinct names from the selected parent", async () => {
    // Given
    const parent = node(NodeKind.Folder, "Workspace", null)
    const repository = createMemoryRepository([parent])
    let state: ControllerState = { ...initialState, nodes: [parent], selectedId: parent.id }
    const setState: StateSetter = (update) => {
      state = typeof update === "function" ? update(state) : update
    }
    const request = {
      repository,
      setState,
      selectedId: state.selectedId,
      kind: NodeKind.Folder,
      name: "Projects",
    } as const

    // When
    await Promise.all([createItem(request), createItem(request)])

    // Then
    expect(
      state.nodes
        .filter((item) => item.parentId === parent.id)
        .map((item) => item.name)
        .sort(),
    ).toEqual(["Projects", "Projects 2"])
    expect(state.screen).toBe("browser")
  })

  it("deletes multiple selected nodes and folder descendants", async () => {
    const folder = node(NodeKind.Folder, "Notes", null)
    const nested = node(NodeKind.File, "Nested.md", folder.id)
    const sibling = node(NodeKind.File, "Sibling.md", null)
    const untouched = node(NodeKind.File, "Untouched.md", null)
    const repository = createMemoryRepository([folder, nested, sibling, untouched])
    let state: ControllerState = {
      ...initialState,
      nodes: [folder, nested, sibling, untouched],
      selectedId: nested.id,
    }
    const setState: StateSetter = (update) => {
      state = typeof update === "function" ? update(state) : update
    }

    const deletedSnapshot = await deleteNodes({
      repository,
      setState,
      nodes: state.nodes,
      selectedIds: [folder.id, sibling.id],
    })

    expect(state.errorMessage).toBeNull()
    expect(state.nodes).toEqual([untouched])
    expect(state.selectedId).toBeNull()

    expect(deletedSnapshot).not.toBeNull()
    if (deletedSnapshot !== null) {
      await restoreDeletedSnapshot(repository, setState, deletedSnapshot)
    }
    expect(state.nodes).toEqual(expect.arrayContaining([folder, nested, sibling, untouched]))
  })

  it("keeps renamed file extensions aligned with document formats", async () => {
    const markdown = node(NodeKind.File, "Draft.md", null)
    const html = node(NodeKind.File, "Page.html", null)
    const folder = node(NodeKind.Folder, "Folder", null)
    const repository = createMemoryRepository(
      [markdown, html, folder],
      [document(markdown.id, DocumentFormat.Markdown), document(html.id, DocumentFormat.Html)],
    )
    let state: ControllerState = {
      ...initialState,
      nodes: [markdown, html, folder],
      selectedId: markdown.id,
    }
    const setState: StateSetter = (update) => {
      state = typeof update === "function" ? update(state) : update
    }

    await renameSelected(repository, setState, markdown.id, "Daily")
    await renameSelected(repository, setState, html.id, "Reference")
    await renameSelected(repository, setState, folder.id, "Archive")

    expect(state.errorMessage).toBeNull()
    expect(state.nodes.map((item) => item.name).sort()).toEqual([
      "Archive",
      "Daily.md",
      "Reference.html",
    ])
  })
})

function node(kind: NodeKind, name: string, parentId: WorkspaceNode["parentId"]): WorkspaceNode {
  return {
    id: createNodeId(),
    parentId,
    kind,
    name,
    createdAt: 1,
    updatedAt: 1,
  }
}

function document(id: WorkspaceDocument["id"], format: DocumentFormat): WorkspaceDocument {
  return {
    id,
    markdown: "",
    format,
    updatedAt: 1,
  }
}

function createMemoryRepository(
  initialNodes: readonly WorkspaceNode[],
  initialDocuments: readonly WorkspaceDocument[] = [],
  savedNodes: WorkspaceNode[] = [],
): WorkspaceRepository {
  let nodes = [...initialNodes]
  let documents = [...initialDocuments]

  return {
    seedIfEmpty: async () => {},
    listNodes: async () => nodes,
    listDocuments: async () => documents,
    getDocument: async (id) => documents.find((document) => document.id === id) ?? null,
    createItem: async (item) => createMemoryItem(item),
    saveNode: async (node) => {
      savedNodes.push(node)
      nodes = [...nodes.filter((item) => item.id !== node.id), node]
    },
    saveDocument: async (document) => {
      documents = [...documents.filter((item) => item.id !== document.id), document]
    },
    deleteNode: async (id) => {
      nodes = nodes.filter((node) => node.id !== id)
    },
    restoreSnapshot: async (snapshot) => {
      nodes = [...nodes, ...snapshot.nodes]
      documents = [...documents, ...snapshot.documents]
    },
    importSnapshot: async (snapshot) => {
      nodes = [...snapshot.nodes]
    },
  }

  async function createMemoryItem(item: WorkspaceItemToCreate): Promise<WorkspaceNode> {
    const parentId = getFolderTarget(nodes, item.selectedId)
    const created = {
      id: item.id,
      parentId,
      kind: item.kind,
      name: uniqueName(nodes, parentId, item.baseName),
      createdAt: item.createdAt,
      updatedAt: item.createdAt,
    }
    savedNodes.push(created)
    nodes = [...nodes, created]
    if (item.kind === NodeKind.File) {
      documents = [
        ...documents,
        { id: item.id, markdown: "", format: DocumentFormat.Markdown, updatedAt: item.createdAt },
      ]
    }
    return created
  }
}
