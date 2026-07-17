import { getFolderTarget, uniqueName } from "../domain/tree"
import type { WorkspaceSnapshot } from "../domain/workspace"
import {
  createNodeId,
  DocumentFormat,
  type NodeId,
  NodeKind,
  type WorkspaceDocument,
  WorkspaceDocumentSchema,
  type WorkspaceNode,
  WorkspaceNodeSchema,
  WorkspaceSnapshotSchema,
} from "../domain/workspace"
import { openWorkspaceDatabase } from "./database"
import { ABOUT_US_HTML, WELCOME_MARKDOWN } from "./sampleWorkspace"

let seedWorkspacePromise: Promise<void> | null = null

export type WorkspaceRepository = {
  readonly seedIfEmpty: () => Promise<void>
  readonly listNodes: () => Promise<readonly WorkspaceNode[]>
  readonly listDocuments: () => Promise<readonly WorkspaceDocument[]>
  readonly getDocument: (id: NodeId) => Promise<WorkspaceDocument | null>
  readonly createItem: (item: WorkspaceItemToCreate) => Promise<WorkspaceNode>
  readonly saveNode: (node: WorkspaceNode) => Promise<void>
  readonly saveDocument: (document: WorkspaceDocument) => Promise<void>
  readonly deleteNode: (id: NodeId) => Promise<void>
  readonly restoreSnapshot: (snapshot: WorkspaceSnapshot) => Promise<void>
  readonly importSnapshot: (snapshot: WorkspaceSnapshot) => Promise<void>
}

export type WorkspaceItemToCreate = {
  readonly id: NodeId
  readonly selectedId: NodeId | null
  readonly kind: NodeKind
  readonly baseName: string
  readonly createdAt: number
}

type WorkspaceTransaction = {
  readonly listNodes: () => Promise<WorkspaceNode[]>
  readonly saveNode: (node: WorkspaceNode) => Promise<void>
  readonly saveDocument: (document: WorkspaceDocument) => Promise<void>
  readonly deleteNode: (id: NodeId) => Promise<void>
  readonly deleteDocument: (id: NodeId) => Promise<void>
  readonly clearNodes: () => Promise<void>
  readonly clearDocuments: () => Promise<void>
  readonly done: Promise<void>
}

export type WorkspaceDatabase = {
  readonly countNodes: () => Promise<number>
  readonly listNodes: () => Promise<WorkspaceNode[]>
  readonly listDocuments: () => Promise<WorkspaceDocument[]>
  readonly getDocument: (id: NodeId) => Promise<WorkspaceDocument | undefined>
  readonly saveNode: (node: WorkspaceNode) => Promise<void>
  readonly saveDocument: (document: WorkspaceDocument) => Promise<void>
  readonly createReadWriteTransaction: () => WorkspaceTransaction
}

export function createWorkspaceRepository(
  openDatabase: () => Promise<WorkspaceDatabase> = openWorkspaceDatabaseAdapter,
): WorkspaceRepository {
  return new IndexedDbWorkspaceRepository(openDatabase)
}

class IndexedDbWorkspaceRepository implements WorkspaceRepository {
  readonly #openDatabase: () => Promise<WorkspaceDatabase>

  constructor(openDatabase: () => Promise<WorkspaceDatabase>) {
    this.#openDatabase = openDatabase
  }

  async seedIfEmpty(): Promise<void> {
    seedWorkspacePromise ??= this.#seedIfEmptyOnce()
    try {
      await seedWorkspacePromise
    } finally {
      seedWorkspacePromise = null
    }
  }

  async #seedIfEmptyOnce(): Promise<void> {
    const database = await this.#openDatabase()
    const count = await database.countNodes()
    if (count > 0) {
      return
    }

    const now = Date.now()
    const welcomeId = createNodeId()
    const htmlId = createNodeId()
    const welcomeNode = {
      id: welcomeId,
      parentId: null,
      kind: NodeKind.File,
      name: "markdown-example.md",
      createdAt: now,
      updatedAt: now,
      pinned: false,
    }
    const htmlNode = {
      id: htmlId,
      parentId: null,
      kind: NodeKind.File,
      name: "about-mding.html",
      createdAt: now,
      updatedAt: now,
      pinned: false,
    }
    const welcomeDocument = {
      id: welcomeId,
      markdown: WELCOME_MARKDOWN,
      format: DocumentFormat.Markdown,
      updatedAt: now,
    }
    const htmlDocument = {
      id: htmlId,
      markdown: ABOUT_US_HTML,
      format: DocumentFormat.Html,
      updatedAt: now,
    }

    const transaction = database.createReadWriteTransaction()
    await transaction.saveNode(welcomeNode)
    await transaction.saveNode(htmlNode)
    await transaction.saveDocument(welcomeDocument)
    await transaction.saveDocument(htmlDocument)
    await transaction.done
  }

  async listNodes(): Promise<readonly WorkspaceNode[]> {
    const database = await this.#openDatabase()
    const nodes = await database.listNodes()
    return nodes.map((node) => WorkspaceNodeSchema.parse(node))
  }

  async listDocuments(): Promise<readonly WorkspaceDocument[]> {
    const database = await this.#openDatabase()
    const documents = await database.listDocuments()
    return documents.map((document) => WorkspaceDocumentSchema.parse(document))
  }

  async getDocument(id: NodeId): Promise<WorkspaceDocument | null> {
    const database = await this.#openDatabase()
    const document = await database.getDocument(id)
    return document === undefined ? null : WorkspaceDocumentSchema.parse(document)
  }

  async createItem(item: WorkspaceItemToCreate): Promise<WorkspaceNode> {
    const database = await this.#openDatabase()
    const transaction = database.createReadWriteTransaction()
    const nodes = await transaction.listNodes()
    const parentId = getFolderTarget(nodes, item.selectedId)
    const node = {
      id: item.id,
      parentId,
      kind: item.kind,
      name: uniqueName(nodes, parentId, item.baseName),
      createdAt: item.createdAt,
      updatedAt: item.createdAt,
    }

    await transaction.saveNode(node)
    if (item.kind === NodeKind.File) {
      await transaction.saveDocument({
        id: item.id,
        markdown: "",
        format: DocumentFormat.Markdown,
        updatedAt: item.createdAt,
      })
    }
    await transaction.done
    return node
  }

  async saveNode(node: WorkspaceNode): Promise<void> {
    const database = await this.#openDatabase()
    await database.saveNode(WorkspaceNodeSchema.parse(node))
  }

  async saveDocument(document: WorkspaceDocument): Promise<void> {
    const database = await this.#openDatabase()
    await database.saveDocument(document)
  }

  async deleteNode(id: NodeId): Promise<void> {
    const database = await this.#openDatabase()
    const transaction = database.createReadWriteTransaction()
    await transaction.deleteNode(id)
    await transaction.deleteDocument(id)
    await transaction.done
  }

  async restoreSnapshot(snapshot: WorkspaceSnapshot): Promise<void> {
    const normalizedSnapshot = WorkspaceSnapshotSchema.parse(snapshot)
    const database = await this.#openDatabase()
    const transaction = database.createReadWriteTransaction()
    for (const node of normalizedSnapshot.nodes) {
      await transaction.saveNode(node)
    }
    for (const document of normalizedSnapshot.documents) {
      await transaction.saveDocument(document)
    }
    await transaction.done
  }

  async importSnapshot(snapshot: WorkspaceSnapshot): Promise<void> {
    const normalizedSnapshot = WorkspaceSnapshotSchema.parse(snapshot)
    const database = await this.#openDatabase()
    const transaction = database.createReadWriteTransaction()
    await transaction.clearNodes()
    await transaction.clearDocuments()
    for (const node of normalizedSnapshot.nodes) {
      await transaction.saveNode(node)
    }
    for (const document of normalizedSnapshot.documents) {
      await transaction.saveDocument(document)
    }
    await transaction.done
  }
}

async function openWorkspaceDatabaseAdapter(): Promise<WorkspaceDatabase> {
  const database = await openWorkspaceDatabase()

  return {
    countNodes: async () => database.count("nodes"),
    listNodes: async () => database.getAll("nodes"),
    listDocuments: async () => database.getAll("documents"),
    getDocument: async (id) => database.get("documents", id),
    saveNode: async (node) => {
      await database.put("nodes", node)
    },
    saveDocument: async (document) => {
      await database.put("documents", document)
    },
    createReadWriteTransaction: () => {
      const transaction = database.transaction(["nodes", "documents"], "readwrite")
      return {
        listNodes: async () => transaction.objectStore("nodes").getAll(),
        saveNode: async (node) => {
          await transaction.objectStore("nodes").put(node)
        },
        saveDocument: async (document) => {
          await transaction.objectStore("documents").put(document)
        },
        deleteNode: async (id) => {
          await transaction.objectStore("nodes").delete(id)
        },
        deleteDocument: async (id) => {
          await transaction.objectStore("documents").delete(id)
        },
        clearNodes: async () => {
          await transaction.objectStore("nodes").clear()
        },
        clearDocuments: async () => {
          await transaction.objectStore("documents").clear()
        },
        done: transaction.done,
      }
    },
  }
}
