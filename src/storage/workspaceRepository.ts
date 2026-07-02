import type { IDBPDatabase } from "idb"
import type { WorkspaceSnapshot } from "../domain/workspace"
import {
  createNodeId,
  type NodeId,
  NodeKind,
  type WorkspaceDocument,
  type WorkspaceNode,
} from "../domain/workspace"
import { type MdingDatabase, openWorkspaceDatabase } from "./database"
import { WELCOME_MARKDOWN } from "./sampleWorkspace"

export type WorkspaceRepository = {
  readonly seedIfEmpty: () => Promise<void>
  readonly listNodes: () => Promise<readonly WorkspaceNode[]>
  readonly listDocuments: () => Promise<readonly WorkspaceDocument[]>
  readonly getDocument: (id: NodeId) => Promise<WorkspaceDocument | null>
  readonly saveNode: (node: WorkspaceNode) => Promise<void>
  readonly saveDocument: (document: WorkspaceDocument) => Promise<void>
  readonly deleteNode: (id: NodeId) => Promise<void>
  readonly importSnapshot: (snapshot: WorkspaceSnapshot) => Promise<void>
}

export function createWorkspaceRepository(): WorkspaceRepository {
  return new IndexedDbWorkspaceRepository(openWorkspaceDatabase)
}

class IndexedDbWorkspaceRepository implements WorkspaceRepository {
  readonly #openDatabase: () => Promise<IDBPDatabase<MdingDatabase>>

  constructor(openDatabase: () => Promise<IDBPDatabase<MdingDatabase>>) {
    this.#openDatabase = openDatabase
  }

  async seedIfEmpty(): Promise<void> {
    const database = await this.#openDatabase()
    const count = await database.count("nodes")
    if (count > 0) {
      return
    }

    const now = Date.now()
    const welcomeId = createNodeId()
    const node = {
      id: welcomeId,
      parentId: null,
      kind: NodeKind.File,
      name: "Welcome.md",
      createdAt: now,
      updatedAt: now,
    }
    const document = {
      id: welcomeId,
      markdown: WELCOME_MARKDOWN,
      updatedAt: now,
    }

    const transaction = database.transaction(["nodes", "documents"], "readwrite")
    await transaction.objectStore("nodes").put(node)
    await transaction.objectStore("documents").put(document)
    await transaction.done
  }

  async listNodes(): Promise<readonly WorkspaceNode[]> {
    const database = await this.#openDatabase()
    return database.getAll("nodes")
  }

  async listDocuments(): Promise<readonly WorkspaceDocument[]> {
    const database = await this.#openDatabase()
    return database.getAll("documents")
  }

  async getDocument(id: NodeId): Promise<WorkspaceDocument | null> {
    const database = await this.#openDatabase()
    return (await database.get("documents", id)) ?? null
  }

  async saveNode(node: WorkspaceNode): Promise<void> {
    const database = await this.#openDatabase()
    await database.put("nodes", node)
  }

  async saveDocument(document: WorkspaceDocument): Promise<void> {
    const database = await this.#openDatabase()
    await database.put("documents", document)
  }

  async deleteNode(id: NodeId): Promise<void> {
    const database = await this.#openDatabase()
    const transaction = database.transaction(["nodes", "documents"], "readwrite")
    await transaction.objectStore("nodes").delete(id)
    await transaction.objectStore("documents").delete(id)
    await transaction.done
  }

  async importSnapshot(snapshot: WorkspaceSnapshot): Promise<void> {
    const database = await this.#openDatabase()
    const transaction = database.transaction(["nodes", "documents"], "readwrite")
    await transaction.objectStore("nodes").clear()
    await transaction.objectStore("documents").clear()
    for (const node of snapshot.nodes) {
      await transaction.objectStore("nodes").put(node)
    }
    for (const document of snapshot.documents) {
      await transaction.objectStore("documents").put(document)
    }
    await transaction.done
  }
}
