import { collectDescendantIds } from "../domain/tree"
import type { NodeId, WorkspaceNode, WorkspaceSnapshot } from "../domain/workspace"
import type { WorkspaceRepository } from "../storage/workspaceRepository"
import { messageFromError, Screen, type StateSetter } from "./workspaceState"

type DeleteNodesRequest = {
  readonly repository: WorkspaceRepository
  readonly setState: StateSetter
  readonly nodes: readonly WorkspaceNode[]
  readonly selectedIds: readonly NodeId[]
}

export async function deleteSelected(
  repository: WorkspaceRepository,
  setState: StateSetter,
  nodes: readonly WorkspaceNode[],
  selectedId: NodeId | null,
): Promise<void> {
  const selectedIds = selectedId === null ? [] : [selectedId]
  await deleteNodes({ repository, setState, nodes, selectedIds })
}

export async function deleteNodes(request: DeleteNodesRequest): Promise<WorkspaceSnapshot | null> {
  if (request.selectedIds.length === 0) {
    request.setState((current) => ({ ...current, errorMessage: "Choose a file or folder first." }))
    return null
  }

  try {
    const idsToDelete = new Set<NodeId>()
    for (const selectedId of request.selectedIds) {
      idsToDelete.add(selectedId)
      for (const descendantId of collectDescendantIds(request.nodes, selectedId)) {
        idsToDelete.add(descendantId)
      }
    }
    const documents = await request.repository.listDocuments()
    const deletedSnapshot = {
      nodes: request.nodes.filter((node) => idsToDelete.has(node.id)),
      documents: documents.filter((document) => idsToDelete.has(document.id)),
    }
    for (const id of idsToDelete) {
      await request.repository.deleteNode(id)
    }
    const refreshedNodes = await request.repository.listNodes()
    request.setState((current) => ({
      ...current,
      nodes: refreshedNodes,
      selectedId: null,
      selectedDocument: null,
      editBuffer: "",
      isEditing: false,
      screen: Screen.Browser,
      errorMessage: null,
    }))
    return deletedSnapshot
  } catch (error) {
    request.setState((current) => ({ ...current, errorMessage: messageFromError(error) }))
    return null
  }
}

export async function restoreDeletedSnapshot(
  repository: WorkspaceRepository,
  setState: StateSetter,
  snapshot: WorkspaceSnapshot,
): Promise<void> {
  try {
    await repository.restoreSnapshot(snapshot)
    const nodes = await repository.listNodes()
    setState((current) => ({ ...current, nodes, errorMessage: null }))
  } catch (error) {
    setState((current) => ({ ...current, errorMessage: messageFromError(error) }))
  }
}
