import { describe, expect, it } from "vitest"
import type { WorkspaceDocument, WorkspaceNode } from "../domain/workspace"
import type { WorkspaceRepository } from "../storage/workspaceRepository"
import { openLaunchedMarkdownFiles } from "./fileLaunchActions"
import { initialState, Screen, type StateSetter } from "./workspaceState"

describe("file launch actions", () => {
  it("opens a Finder-launched Markdown file as the selected document", async () => {
    const repository = createMemoryRepository()
    let state = initialState
    const setState: StateSetter = (update) => {
      state = typeof update === "function" ? update(state) : update
    }
    const file = new File(["# From Finder"], "finder.md", { type: "text/markdown" })

    await openLaunchedMarkdownFiles({ repository, setState, files: [file] })

    expect(state.nodes).toHaveLength(1)
    expect(state.selectedDocument?.markdown).toBe("# From Finder")
    expect(state.editBuffer).toBe("# From Finder")
    expect(state.screen).toBe(Screen.Document)
  })
})

function createMemoryRepository(): WorkspaceRepository {
  let nodes: WorkspaceNode[] = []
  let documents: WorkspaceDocument[] = []

  return {
    seedIfEmpty: async () => {},
    listNodes: async () => nodes,
    listDocuments: async () => documents,
    getDocument: async (id) => documents.find((document) => document.id === id) ?? null,
    saveNode: async (node) => {
      nodes = replaceNode(nodes, node)
    },
    saveDocument: async (document) => {
      documents = replaceDocument(documents, document)
    },
    deleteNode: async (id) => {
      nodes = nodes.filter((node) => node.id !== id)
      documents = documents.filter((document) => document.id !== id)
    },
    importSnapshot: async (snapshot) => {
      nodes = [...snapshot.nodes]
      documents = [...snapshot.documents]
    },
  }
}

function replaceNode(nodes: readonly WorkspaceNode[], node: WorkspaceNode): WorkspaceNode[] {
  return [...nodes.filter((item) => item.id !== node.id), node]
}

function replaceDocument(
  documents: readonly WorkspaceDocument[],
  document: WorkspaceDocument,
): WorkspaceDocument[] {
  return [...documents.filter((item) => item.id !== document.id), document]
}
