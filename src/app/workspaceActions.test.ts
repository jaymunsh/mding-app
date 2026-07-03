import { afterEach, describe, expect, it, vi } from "vitest"
import {
  createNodeId,
  NodeKind,
  type WorkspaceDocument,
  type WorkspaceNode,
} from "../domain/workspace"
import type { WorkspaceRepository } from "../storage/workspaceRepository"
import { deleteNodes, moveNodes } from "./workspaceActions"
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

    await moveNodes({
      repository,
      setState,
      selectedIds: [first.id, second.id],
      parentId: folder.id,
    })

    expect(state.errorMessage).toBeNull()
    expect(state.nodes).toEqual([
      folder,
      { ...first, parentId: folder.id, updatedAt: Date.now() },
      { ...second, parentId: folder.id, updatedAt: Date.now() },
    ])
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

    await deleteNodes({
      repository,
      setState,
      nodes: state.nodes,
      selectedIds: [folder.id, sibling.id],
    })

    expect(state.errorMessage).toBeNull()
    expect(state.nodes).toEqual([untouched])
    expect(state.selectedId).toBeNull()
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

function createMemoryRepository(initialNodes: readonly WorkspaceNode[]): WorkspaceRepository {
  let nodes = [...initialNodes]
  const documents: readonly WorkspaceDocument[] = []

  return {
    seedIfEmpty: async () => {},
    listNodes: async () => nodes,
    listDocuments: async () => documents,
    getDocument: async (id) => documents.find((document) => document.id === id) ?? null,
    saveNode: async (node) => {
      nodes = [...nodes.filter((item) => item.id !== node.id), node]
    },
    saveDocument: async () => {},
    deleteNode: async (id) => {
      nodes = nodes.filter((node) => node.id !== id)
    },
    importSnapshot: async (snapshot) => {
      nodes = [...snapshot.nodes]
    },
  }
}
