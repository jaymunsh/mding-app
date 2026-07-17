import { findNode, moveNodesToParent } from "../domain/tree"
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

export type MutationOutcome =
  | { readonly kind: "success" }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "no-op"; readonly message: string }

type ItemRequest = {
  readonly repository: WorkspaceRepository
  readonly setState: StateSetter
  readonly selectedId: NodeId | null
  readonly kind: NodeKind
  readonly name?: string | undefined
}

type MoveRequest = {
  readonly repository: WorkspaceRepository
  readonly setState: StateSetter
  readonly selectedId: NodeId | null
  readonly parentId: NodeId | null
}

type MoveNodesRequest = {
  readonly repository: WorkspaceRepository
  readonly setState: StateSetter
  readonly selectedIds: readonly NodeId[]
  readonly parentId: NodeId | null
}

type FilePinRequest = {
  readonly repository: WorkspaceRepository
  readonly setState: StateSetter
  readonly id: NodeId
  readonly pinned: boolean
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
    return undefined
  })
}

export async function createItem(request: ItemRequest): Promise<MutationOutcome> {
  const baseName =
    request.kind === NodeKind.File
      ? normalizeMarkdownFileName(request.name)
      : request.name?.trim() || "Folder"
  const now = Date.now()
  const id = createNodeId()

  return withError(request.setState, async () => {
    await request.repository.createItem({
      id,
      selectedId: request.selectedId,
      kind: request.kind,
      baseName,
      createdAt: now,
    })
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
    return undefined
  })
}

function normalizeMarkdownFileName(name: string | undefined): string {
  const trimmedName = name?.trim() ?? ""
  if (trimmedName.length === 0) {
    return "Untitled.md"
  }

  return trimmedName.toLowerCase().endsWith(".md") ? trimmedName : `${trimmedName}.md`
}

export async function moveSelected(request: MoveRequest): Promise<MutationOutcome> {
  const selectedIds = request.selectedId === null ? [] : [request.selectedId]
  return moveNodes({ ...request, selectedIds })
}

export async function moveNodes(request: MoveNodesRequest): Promise<MutationOutcome> {
  if (request.selectedIds.length === 0) {
    return noOp(request.setState, "Choose a file or folder first.")
  }

  return withError(request.setState, async () => {
    const nodes = await request.repository.listNodes()
    const result = moveNodesToParent({
      nodes,
      selectedIds: request.selectedIds,
      parentId: request.parentId,
      updatedAt: Date.now(),
    })
    if (result.kind === "invalid") {
      return noOp(request.setState, result.message)
    }
    for (const movedId of result.movedIds) {
      const node = findNode(result.nodes, movedId)
      if (node === null) {
        throw new Error("Selected item no longer exists.")
      }
      await request.repository.saveNode(node)
    }
    await refreshAfterMutation(request.repository, request.setState)
    return undefined
  })
}

export async function setFilePinned(request: FilePinRequest): Promise<MutationOutcome> {
  return withError(request.setState, async () => {
    const nodes = await request.repository.listNodes()
    const node = findNode(nodes, request.id)
    if (node?.kind !== NodeKind.File) {
      return noOp(request.setState, "Select a file first.")
    }
    await request.repository.saveNode({ ...node, pinned: request.pinned })
    await refreshAfterMutation(request.repository, request.setState)
    return undefined
  })
}

async function refreshAfterMutation(
  repository: WorkspaceRepository,
  setState: StateSetter,
): Promise<void> {
  const nodes = await repository.listNodes()
  setState((current) => ({ ...current, nodes, errorMessage: null }))
}

function noOp(setState: StateSetter, message: string): MutationOutcome {
  setState((current) => ({ ...current, errorMessage: message }))
  return { kind: "no-op", message }
}

async function withError(
  setState: StateSetter,
  operation: () => Promise<MutationOutcome | undefined>,
): Promise<MutationOutcome> {
  try {
    const outcome = await operation()
    return outcome ?? { kind: "success" }
  } catch (error) {
    const message = messageFromError(error)
    setState((current) => ({ ...current, errorMessage: message }))
    return { kind: "error", message }
  }
}
