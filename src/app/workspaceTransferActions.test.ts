import { describe, expect, it } from "vitest"
import {
  createNodeId,
  NodeKind,
  type WorkspaceDocument,
  type WorkspaceNode,
  type WorkspaceSnapshot,
} from "../domain/workspace"
import type { WorkspaceRepository } from "../storage/workspaceRepository"
import { type ControllerState, initialState, type StateSetter } from "./workspaceState"
import { importDocumentFiles } from "./workspaceTransferActions"

describe("workspace transfer actions", () => {
  it("imports document files at the workspace root even when a folder is selected", async () => {
    const folder = node("Inbox", null)
    const repository = createMemoryRepository([folder])
    let state: ControllerState = {
      ...initialState,
      nodes: [folder],
      selectedId: folder.id,
    }
    const setState: StateSetter = (update) => {
      state = typeof update === "function" ? update(state) : update
    }
    const file = new File(["# Imported"], "imported.md", { type: "text/markdown" })

    await importDocumentFiles({
      repository,
      setState,
      files: [file],
    })

    const importedNode = state.nodes.find((item) => item.name === "imported.md")
    expect(importedNode?.parentId).toBeNull()
  })
})

function node(name: string, parentId: WorkspaceNode["parentId"]): WorkspaceNode {
  return {
    id: createNodeId(),
    parentId,
    kind: NodeKind.Folder,
    name,
    createdAt: 1,
    updatedAt: 1,
  }
}

function createMemoryRepository(initialNodes: readonly WorkspaceNode[]): WorkspaceRepository {
  let nodes = [...initialNodes]
  let documents: WorkspaceDocument[] = []

  return {
    seedIfEmpty: async () => {},
    listNodes: async () => nodes,
    listDocuments: async () => documents,
    getDocument: async (id) => documents.find((document) => document.id === id) ?? null,
    createItem: async (item) => ({
      id: item.id,
      parentId: null,
      kind: item.kind,
      name: item.baseName,
      createdAt: item.createdAt,
      updatedAt: item.createdAt,
    }),
    saveNode: async (node) => {
      nodes = [...nodes.filter((item) => item.id !== node.id), node]
    },
    saveDocument: async (document) => {
      documents = [...documents.filter((item) => item.id !== document.id), document]
    },
    deleteNode: async (id) => {
      nodes = nodes.filter((node) => node.id !== id)
      documents = documents.filter((document) => document.id !== id)
    },
    restoreSnapshot: async (snapshot) => {
      nodes = [...nodes, ...snapshot.nodes]
      documents = [...documents, ...snapshot.documents]
    },
    importSnapshot: async (snapshot: WorkspaceSnapshot) => {
      nodes = [...snapshot.nodes]
      documents = [...snapshot.documents]
    },
  }
}
