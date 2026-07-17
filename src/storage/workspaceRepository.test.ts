import { describe, expect, it } from "vitest"
import {
  createNodeId,
  NodeKind,
  type WorkspaceDocument,
  type WorkspaceNode,
  type WorkspaceSnapshot,
} from "../domain/workspace"
import {
  createWorkspaceRepository,
  type WorkspaceDatabase,
  type WorkspaceItemToCreate,
} from "./workspaceRepository"

class MemoryWorkspaceDatabase implements WorkspaceDatabase {
  readonly #nodes = new Map<WorkspaceNode["id"], WorkspaceNode>()
  readonly #documents = new Map<WorkspaceDocument["id"], WorkspaceDocument>()

  async countNodes(): Promise<number> {
    return this.#nodes.size
  }

  async listNodes(): Promise<WorkspaceNode[]> {
    return [...this.#nodes.values()]
  }

  async listDocuments(): Promise<WorkspaceDocument[]> {
    return [...this.#documents.values()]
  }

  async getDocument(id: WorkspaceDocument["id"]): Promise<WorkspaceDocument | undefined> {
    return this.#documents.get(id)
  }

  async saveNode(node: WorkspaceNode): Promise<void> {
    this.#nodes.set(node.id, node)
  }

  async saveDocument(document: WorkspaceDocument): Promise<void> {
    this.#documents.set(document.id, document)
  }

  saveLegacyNode(node: WorkspaceNode): void {
    this.#nodes.set(node.id, node)
  }

  createReadWriteTransaction() {
    return {
      listNodes: () => this.listNodes(),
      saveNode: async (node: WorkspaceNode) => this.saveNode(node),
      saveDocument: async (document: WorkspaceDocument) => this.saveDocument(document),
      deleteNode: async (id: WorkspaceNode["id"]) => {
        this.#nodes.delete(id)
      },
      deleteDocument: async (id: WorkspaceDocument["id"]) => {
        this.#documents.delete(id)
      },
      clearNodes: async () => {
        this.#nodes.clear()
      },
      clearDocuments: async () => {
        this.#documents.clear()
      },
      done: Promise.resolve(),
    }
  }
}

describe("IndexedDB workspace repository", () => {
  it("creates collision-safe folders in the selected parent", async () => {
    // Given
    const database = new MemoryWorkspaceDatabase()
    const repository = createWorkspaceRepository(async () => database)
    const parent = node(NodeKind.Folder, "Workspace", null)
    await repository.saveNode(parent)

    // When
    const first = await repository.createItem(createFolderRequest(parent.id, "Projects"))
    const second = await repository.createItem(createFolderRequest(parent.id, "Projects"))

    // Then
    expect([first.name, second.name].sort()).toEqual(["Projects", "Projects 2"])
    expect(
      (await repository.listNodes()).filter((item) => item.parentId === parent.id),
    ).toHaveLength(2)
  })

  it("normalizes legacy records and preserves a pinned file across save, delete, and restore", async () => {
    // Given
    const database = new MemoryWorkspaceDatabase()
    const repository = createWorkspaceRepository(async () => database)
    const legacyFileId = createNodeId()
    const pinnedFileId = createNodeId()
    database.saveLegacyNode({
      id: legacyFileId,
      parentId: null,
      kind: NodeKind.File,
      name: "legacy.md",
      createdAt: 1,
      updatedAt: 1,
    })
    const pinnedFile = {
      id: pinnedFileId,
      parentId: null,
      kind: NodeKind.File,
      name: "pinned.md",
      createdAt: 2,
      updatedAt: 2,
      pinned: true,
    }
    const snapshot: WorkspaceSnapshot = { nodes: [pinnedFile], documents: [] }

    // When
    await repository.saveNode(pinnedFile)
    await repository.deleteNode(pinnedFileId)
    await repository.restoreSnapshot(snapshot)
    const loadedNodes = await repository.listNodes()
    const loadedFileNodes = loadedNodes.filter((node) => node.kind === NodeKind.File)

    // Then
    expect(loadedFileNodes.find((node) => node.id === legacyFileId)?.pinned).toBe(false)
    expect(loadedFileNodes.find((node) => node.id === pinnedFileId)?.pinned).toBe(true)
  })
})

function createFolderRequest(
  selectedId: WorkspaceNode["id"],
  baseName: string,
): WorkspaceItemToCreate {
  return {
    id: createNodeId(),
    selectedId,
    kind: NodeKind.Folder,
    baseName,
    createdAt: 1,
  }
}

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
