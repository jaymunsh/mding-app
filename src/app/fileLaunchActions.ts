import { NodeKind, type WorkspaceNode } from "../domain/workspace"
import { createSnapshotFromMarkdown, parseMarkdownFiles } from "../storage/importExport"
import type { WorkspaceRepository } from "../storage/workspaceRepository"
import { messageFromError, Screen, type StateSetter } from "./workspaceState"

type FileLaunchRequest = {
  readonly repository: WorkspaceRepository
  readonly setState: StateSetter
  readonly files: readonly File[]
}

export async function openLaunchedMarkdownFiles(request: FileLaunchRequest): Promise<void> {
  try {
    const imports = await parseMarkdownFiles(request.files)
    if (imports.length === 0) {
      return
    }

    const snapshot = createSnapshotFromMarkdown(imports, null)
    const firstNode = firstFileNode(snapshot.nodes)
    if (firstNode === null) {
      return
    }

    for (const node of snapshot.nodes) {
      await request.repository.saveNode(node)
    }
    for (const document of snapshot.documents) {
      await request.repository.saveDocument(document)
    }

    const nodes = await request.repository.listNodes()
    const selectedDocument =
      snapshot.documents.find((document) => document.id === firstNode.id) ?? null
    request.setState((current) => ({
      ...current,
      nodes,
      selectedId: firstNode.id,
      selectedDocument,
      editBuffer: selectedDocument?.markdown ?? "",
      isEditing: false,
      screen: Screen.Document,
      errorMessage: null,
    }))
  } catch (error) {
    request.setState((current) => ({ ...current, errorMessage: messageFromError(error) }))
  }
}

function firstFileNode(nodes: readonly WorkspaceNode[]): WorkspaceNode | null {
  return nodes.find((node) => node.kind === NodeKind.File) ?? null
}
