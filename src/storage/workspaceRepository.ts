import type { IDBPDatabase } from "idb"
import type { WorkspaceSnapshot } from "../domain/workspace"
import {
  createNodeId,
  DocumentFormat,
  type NodeId,
  NodeKind,
  type WorkspaceDocument,
  WorkspaceDocumentSchema,
  type WorkspaceNode,
} from "../domain/workspace"
import { type MdingDatabase, openWorkspaceDatabase } from "./database"
import { ABOUT_US_HTML, WELCOME_MARKDOWN } from "./sampleWorkspace"

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
    const htmlId = createNodeId()
    const welcomeNode = {
      id: welcomeId,
      parentId: null,
      kind: NodeKind.File,
      name: "Welcome.md",
      createdAt: now,
      updatedAt: now,
    }
    const htmlNode = {
      id: htmlId,
      parentId: null,
      kind: NodeKind.File,
      name: "AboutUs.html",
      createdAt: now,
      updatedAt: now,
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

    const transaction = database.transaction(["nodes", "documents"], "readwrite")
    await transaction.objectStore("nodes").put(welcomeNode)
    await transaction.objectStore("nodes").put(htmlNode)
    await transaction.objectStore("documents").put(welcomeDocument)
    await transaction.objectStore("documents").put(htmlDocument)
    await transaction.done
  }

  async listNodes(): Promise<readonly WorkspaceNode[]> {
    const database = await this.#openDatabase()
    return database.getAll("nodes")
  }

  async listDocuments(): Promise<readonly WorkspaceDocument[]> {
    const database = await this.#openDatabase()
    const documents = await database.getAll("documents")
    return documents.map((document) => WorkspaceDocumentSchema.parse(document))
  }

  async getDocument(id: NodeId): Promise<WorkspaceDocument | null> {
    const database = await this.#openDatabase()
    const document = await database.get("documents", id)
    return document === undefined ? null : WorkspaceDocumentSchema.parse(document)
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
