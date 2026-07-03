import { findNode, getFolderTarget, uniqueName } from "../domain/tree"
import type { WorkspaceNode } from "../domain/workspace"
import {
  createNodeId,
  DocumentFormat,
  isEditableDocument,
  type NodeId,
  NodeKind,
  type WorkspaceDocument,
} from "../domain/workspace"
import { requestPersistentStorage } from "../storage/importExport"
import type { WorkspaceRepository } from "../storage/workspaceRepository"
import { messageFromError, Screen, type StateSetter } from "./workspaceState"

type ItemRequest = {
  readonly repository: WorkspaceRepository
  readonly setState: StateSetter
  readonly nodes: readonly WorkspaceNode[]
  readonly selectedId: NodeId | null
  readonly kind: NodeKind
}

type MoveRequest = {
  readonly repository: WorkspaceRepository
  readonly setState: StateSetter
  readonly nodes: readonly WorkspaceNode[]
  readonly selectedId: NodeId | null
  readonly parentId: NodeId | null
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
    setState((current) => ({ ...current, errorMessage: "Select a file first." }))
    return
  }

  if (!isEditableDocument(selectedDocument)) {
    setState((current) => ({ ...current, errorMessage: "HTML files are preview-only." }))
    return
  }

  await withError(setState, async () => {
    const updatedAt = Date.now()
    const document = { ...selectedDocument, markdown: editBuffer, updatedAt }
    const nodes = await repository.listNodes()
    const node = findNode(nodes, selectedDocument.id)
    await repository.saveDocument(document)
    if (node !== null) {
      await repository.saveNode({ ...node, updatedAt })
    }
    const refreshedNodes = await repository.listNodes()
    setState((current) =>
      current.selectedDocument?.id === selectedDocument.id
        ? {
            ...current,
            nodes: refreshedNodes,
            selectedDocument: document,
            isEditing: false,
            errorMessage: null,
          }
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
      await request.repository.saveDocument({
        id,
        markdown: "",
        format: DocumentFormat.Markdown,
        updatedAt: now,
      })
    }
    const nodes = await request.repository.listNodes()
    request.setState((current) => ({
      ...current,
      nodes,
      selectedId: id,
      selectedDocument:
        request.kind === NodeKind.File
          ? { id, markdown: "", format: DocumentFormat.Markdown, updatedAt: now }
          : null,
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

export async function moveSelected(request: MoveRequest): Promise<void> {
  if (request.selectedId === null) {
    request.setState((current) => ({ ...current, errorMessage: "Choose a file or folder first." }))
    return
  }

  if (request.selectedId === request.parentId) {
    request.setState((current) => ({ ...current, errorMessage: "Choose a different folder." }))
    return
  }

  if (request.parentId !== null) {
    const target = findNode(request.nodes, request.parentId)
    if (target?.kind !== NodeKind.Folder) {
      request.setState((current) => ({ ...current, errorMessage: "Choose a folder target." }))
      return
    }
  }

  if (
    request.parentId !== null &&
    isDescendant(request.nodes, request.selectedId, request.parentId)
  ) {
    request.setState((current) => ({ ...current, errorMessage: "Cannot move into itself." }))
    return
  }

  await withError(request.setState, async () => {
    const nodes = await request.repository.listNodes()
    const node = findNode(nodes, request.selectedId)
    if (node === null) {
      throw new Error("Selected item no longer exists.")
    }
    await request.repository.saveNode({
      ...node,
      parentId: request.parentId,
      updatedAt: Date.now(),
    })
    await refreshAfterMutation(request.repository, request.setState)
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

function isDescendant(
  nodes: readonly WorkspaceNode[],
  ancestorId: NodeId,
  candidateId: NodeId,
): boolean {
  return collectDescendantIds(nodes, ancestorId).includes(candidateId)
}
