import { findNode } from "../domain/tree"
import type { WorkspaceNode } from "../domain/workspace"
import { type NodeId, NodeKind } from "../domain/workspace"
import { documentFilename } from "../storage/documentFiles"
import type { WorkspaceRepository } from "../storage/workspaceRepository"
import { messageFromError, type StateSetter } from "./workspaceState"

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
    const normalizedName = await normalizeRenameName(repository, node, trimmedName)
    await repository.saveNode({ ...node, name: normalizedName, updatedAt: Date.now() })
    const refreshedNodes = await repository.listNodes()
    setState((current) => ({ ...current, nodes: refreshedNodes, errorMessage: null }))
  })
}

async function normalizeRenameName(
  repository: WorkspaceRepository,
  node: WorkspaceNode,
  name: string,
): Promise<string> {
  if (node.kind !== NodeKind.File) {
    return name
  }

  const document = await repository.getDocument(node.id)
  if (document === null) {
    throw new Error("Selected item no longer exists.")
  }
  return documentFilename(name, document.format)
}

async function withError(setState: StateSetter, operation: () => Promise<void>): Promise<void> {
  try {
    await operation()
  } catch (error) {
    setState((current) => ({ ...current, errorMessage: messageFromError(error) }))
  }
}
