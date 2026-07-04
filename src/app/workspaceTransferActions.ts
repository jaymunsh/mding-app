import type { WorkspaceDocument, WorkspaceNode } from "../domain/workspace"
import {
  createDocumentFileBlob,
  createSnapshotFromDocumentFiles,
  createWorkspaceBackupBlob,
  downloadBlob,
  formatBackupDate,
  parseDocumentFiles,
  parseWorkspaceBackupFile,
} from "../storage/importExport"
import type { WorkspaceRepository } from "../storage/workspaceRepository"
import { messageFromError, type StateSetter } from "./workspaceState"

type DocumentImportRequest = {
  readonly repository: WorkspaceRepository
  readonly setState: StateSetter
  readonly files: readonly File[]
}

export async function importDocumentFiles(request: DocumentImportRequest): Promise<void> {
  await withError(request.setState, async () => {
    const imports = await parseDocumentFiles(request.files)
    const snapshot = createSnapshotFromDocumentFiles(imports, null)
    for (const node of snapshot.nodes) {
      await request.repository.saveNode(node)
    }
    for (const document of snapshot.documents) {
      await request.repository.saveDocument(document)
    }
    await refreshNodes(request.repository, request.setState)
  })
}

export async function importWorkspaceFile(
  repository: WorkspaceRepository,
  setState: StateSetter,
  file: File,
): Promise<void> {
  await withError(setState, async () => {
    const snapshot = await parseWorkspaceBackupFile(file)
    await repository.importSnapshot(snapshot)
    const nodes = await repository.listNodes()
    setState((current) => ({ ...current, nodes, selectedId: null, selectedDocument: null }))
  })
}

export function exportSelectedDocument(
  node: WorkspaceNode | null,
  document: WorkspaceDocument | null,
): void {
  if (node === null || document === null) {
    return
  }
  downloadBlob(createDocumentFileBlob(document), node.name)
}

export async function exportWorkspace(
  repository: WorkspaceRepository,
  setState: StateSetter,
): Promise<void> {
  await withError(setState, async () => {
    const snapshot = {
      nodes: await repository.listNodes(),
      documents: await repository.listDocuments(),
    }
    downloadBlob(createWorkspaceBackupBlob(snapshot), `mding-${formatBackupDate(new Date())}.zip`)
  })
}

async function refreshNodes(repository: WorkspaceRepository, setState: StateSetter): Promise<void> {
  const nodes = await repository.listNodes()
  setState((current) => ({ ...current, nodes, errorMessage: null }))
}

async function withError(setState: StateSetter, operation: () => Promise<void>): Promise<void> {
  try {
    await operation()
  } catch (error) {
    setState((current) => ({ ...current, errorMessage: messageFromError(error) }))
  }
}
