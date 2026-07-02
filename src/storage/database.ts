import { type DBSchema, type IDBPDatabase, openDB } from "idb"
import type { WorkspaceDocument, WorkspaceNode } from "../domain/workspace"

export type MdingDatabase = DBSchema & {
  readonly nodes: {
    readonly key: string
    readonly value: WorkspaceNode
    readonly indexes: {
      readonly byParent: string
    }
  }
  readonly documents: {
    readonly key: string
    readonly value: WorkspaceDocument
  }
}

const DATABASE_NAME = "mding-workspace"
const DATABASE_VERSION = 1

let databasePromise: Promise<IDBPDatabase<MdingDatabase>> | null = null

export function openWorkspaceDatabase(): Promise<IDBPDatabase<MdingDatabase>> {
  if (databasePromise === null) {
    databasePromise = openDB<MdingDatabase>(DATABASE_NAME, DATABASE_VERSION, {
      upgrade(database) {
        const nodeStore = database.createObjectStore("nodes", { keyPath: "id" })
        nodeStore.createIndex("byParent", "parentId")
        database.createObjectStore("documents", { keyPath: "id" })
      },
    })
  }

  return databasePromise
}
