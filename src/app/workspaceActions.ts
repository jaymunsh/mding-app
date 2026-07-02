import { findNode, getFolderTarget, uniqueName } from "../domain/tree"
import type { WorkspaceNode } from "../domain/workspace"
import { createNodeId, type NodeId, NodeKind, type WorkspaceDocument } from "../domain/workspace"
import {
  createMarkdownFileBlob,
  createSnapshotFromMarkdown,
  createWorkspaceBackupBlob,
  downloadBlob,
  formatBackupDate,
  parseMarkdownFiles,
  parseWorkspaceBackup,
  requestPersistentStorage,
} from "../storage/importExport"
import type { WorkspaceRepository } from "../storage/workspaceRepository"
import { messageFromError, Screen, type StateSetter } from "./workspaceState"

type ItemRequest = {
  readonly repository: WorkspaceRepository
  readonly setState: StateSetter
  readonly nodes: readonly WorkspaceNode[]
  readonly selectedId: NodeId | null
  readonly kind: NodeKind
}

type MarkdownImportRequest = {
  readonly repository: WorkspaceRepository
  readonly setState: StateSetter
  readonly nodes: readonly WorkspaceNode[]
  readonly selectedId: NodeId | null
  readonly files: readonly File[]
}

export async function initializeWorkspace(
  repository: WorkspaceRepository,
  setState: StateSetter,
): Promise<void> {
  try {
    await repository.seedIfEmpty()
    const nodes = await repository.listNodes()
    const storagePersisted = await requestPersistentStorage()
    setState((current) => ({ ...current, nodes, storagePersisted }))
  } catch (error) {
    setState((current) => ({ ...current, errorMessage: messageFromError(error) }))
  }
}

export async function selectNode(
  repository: WorkspaceRepository,
  setState: StateSetter,
  id: NodeId,
): Promise<void> {
  try {
    const nodes = await repository.listNodes()
    const node = findNode(nodes, id)
    const document = node?.kind === NodeKind.File ? await repository.getDocument(id) : null
    setState((current) => ({
      ...current,
      nodes,
      selectedId: id,
      selectedDocument: document,
      editBuffer: document?.markdown ?? "",
      isEditing: false,
      screen: node?.kind === NodeKind.File ? Screen.Document : current.screen,
      errorMessage: null,
    }))
  } catch (error) {
    setState((current) => ({ ...current, errorMessage: messageFromError(error) }))
  }
}

export async function saveSelectedDocument(
  repository: WorkspaceRepository,
  setState: StateSetter,
  selectedDocument: WorkspaceDocument | null,
  editBuffer: string,
): Promise<void> {
  if (selectedDocument === null) {
    setState((current) => ({ ...current, errorMessage: "Select a Markdown file first." }))
    return
  }

  await withError(setState, async () => {
    const document = { ...selectedDocument, markdown: editBuffer, updatedAt: Date.now() }
    await repository.saveDocument(document)
    setState((current) =>
      current.selectedDocument?.id === selectedDocument.id
        ? { ...current, selectedDocument: document, isEditing: false, errorMessage: null }
        : current,
    )
  })
}

export async function createItem(request: ItemRequest): Promise<void> {
  const parentId = getFolderTarget(request.nodes, request.selectedId)
  const baseName = request.kind === NodeKind.File ? "Untitled.md" : "Folder"
  const name = uniqueName(request.nodes, parentId, baseName)
  const now = Date.now()
  const id = createNodeId()
  const node = { id, parentId, kind: request.kind, name, createdAt: now, updatedAt: now }

  await withError(request.setState, async () => {
    await request.repository.saveNode(node)
    if (request.kind === NodeKind.File) {
      await request.repository.saveDocument({ id, markdown: "", updatedAt: now })
    }
    const nodes = await request.repository.listNodes()
    request.setState((current) => ({
      ...current,
      nodes,
      selectedId: id,
      selectedDocument:
        request.kind === NodeKind.File ? { id, markdown: "", updatedAt: now } : null,
      editBuffer: "",
      isEditing: request.kind === NodeKind.File,
      screen: request.kind === NodeKind.File ? Screen.Document : current.screen,
      errorMessage: null,
    }))
  })
}

export async function renameSelected(
  repository: WorkspaceRepository,
  setState: StateSetter,
  selectedId: NodeId | null,
  name: string,
): Promise<void> {
  const trimmedName = name.trim()
  if (selectedId === null || trimmedName.length === 0) {
    setState((current) => ({
      ...current,
      errorMessage: "Choose a file or folder and enter a name.",
    }))
    return
  }

  await withError(setState, async () => {
    const nodes = await repository.listNodes()
    const node = findNode(nodes, selectedId)
    if (node === null) {
      throw new Error("Selected item no longer exists.")
    }
    await repository.saveNode({ ...node, name: trimmedName, updatedAt: Date.now() })
    await refreshAfterMutation(repository, setState)
  })
}

export async function deleteSelected(
  repository: WorkspaceRepository,
  setState: StateSetter,
  nodes: readonly WorkspaceNode[],
  selectedId: NodeId | null,
): Promise<void> {
  if (selectedId === null) {
    setState((current) => ({ ...current, errorMessage: "Choose a file or folder first." }))
    return
  }

  await withError(setState, async () => {
    for (const id of collectDescendantIds(nodes, selectedId)) {
      await repository.deleteNode(id)
    }
    await repository.deleteNode(selectedId)
    const refreshedNodes = await repository.listNodes()
    setState((current) => ({
      ...current,
      nodes: refreshedNodes,
      selectedId: null,
      selectedDocument: null,
      editBuffer: "",
      isEditing: false,
      screen: Screen.Browser,
      errorMessage: null,
    }))
  })
}

export async function moveSelectedToRoot(
  repository: WorkspaceRepository,
  setState: StateSetter,
  selectedId: NodeId | null,
): Promise<void> {
  if (selectedId === null) {
    setState((current) => ({ ...current, errorMessage: "Choose a file or folder first." }))
    return
  }

  await withError(setState, async () => {
    const nodes = await repository.listNodes()
    const node = findNode(nodes, selectedId)
    if (node === null) {
      throw new Error("Selected item no longer exists.")
    }
    await repository.saveNode({ ...node, parentId: null, updatedAt: Date.now() })
    await refreshAfterMutation(repository, setState)
  })
}

export async function importMarkdownFiles(request: MarkdownImportRequest): Promise<void> {
  await withError(request.setState, async () => {
    const parentId = getFolderTarget(request.nodes, request.selectedId)
    const imports = await parseMarkdownFiles(request.files)
    const snapshot = createSnapshotFromMarkdown(imports, parentId)
    for (const node of snapshot.nodes) {
      await request.repository.saveNode(node)
    }
    for (const document of snapshot.documents) {
      await request.repository.saveDocument(document)
    }
    await refreshAfterMutation(request.repository, request.setState)
  })
}

export async function importWorkspaceFile(
  repository: WorkspaceRepository,
  setState: StateSetter,
  file: File,
): Promise<void> {
  await withError(setState, async () => {
    const snapshot = parseWorkspaceBackup(await file.text())
    await repository.importSnapshot(snapshot)
    const nodes = await repository.listNodes()
    setState((current) => ({ ...current, nodes, selectedId: null, selectedDocument: null }))
  })
}

export function exportSelectedMarkdown(
  node: WorkspaceNode | null,
  document: WorkspaceDocument | null,
): void {
  if (node === null || document === null) {
    return
  }
  downloadBlob(createMarkdownFileBlob(document.markdown), node.name)
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
    downloadBlob(createWorkspaceBackupBlob(snapshot), `mding-${formatBackupDate(new Date())}.json`)
  })
}

async function refreshAfterMutation(
  repository: WorkspaceRepository,
  setState: StateSetter,
): Promise<void> {
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

function collectDescendantIds(
  nodes: readonly WorkspaceNode[],
  parentId: NodeId,
): readonly NodeId[] {
  const directChildren = nodes.filter((node) => node.parentId === parentId)
  return directChildren.flatMap((node) => [node.id, ...collectDescendantIds(nodes, node.id)])
}
