import { type NodeId, NodeKind, type TreeNode, type WorkspaceNode } from "./workspace"

export const TreeSortOrder = {
  Name: "name",
  Updated: "updated",
} as const

export type TreeSortOrder = (typeof TreeSortOrder)[keyof typeof TreeSortOrder]

type MoveNodesRequest = {
  readonly nodes: readonly WorkspaceNode[]
  readonly selectedIds: readonly NodeId[]
  readonly parentId: NodeId | null
  readonly updatedAt: number
}

type MoveNodesResult =
  | {
      readonly kind: "moved"
      readonly nodes: readonly WorkspaceNode[]
      readonly movedIds: readonly NodeId[]
    }
  | {
      readonly kind: "invalid"
      readonly message: string
    }

export function buildTree(
  nodes: readonly WorkspaceNode[],
  sortOrder: TreeSortOrder = TreeSortOrder.Name,
): readonly TreeNode[] {
  return buildChildren(nodes, null, sortOrder)
}

export function findNode(nodes: readonly WorkspaceNode[], id: NodeId | null): WorkspaceNode | null {
  if (id === null) {
    return null
  }

  return nodes.find((node) => node.id === id) ?? null
}

export function getFolderTarget(
  nodes: readonly WorkspaceNode[],
  selectedId: NodeId | null,
): NodeId | null {
  const selectedNode = findNode(nodes, selectedId)
  if (selectedNode === null) {
    return null
  }

  return selectedNode.kind === NodeKind.Folder ? selectedNode.id : selectedNode.parentId
}

export function uniqueName(
  nodes: readonly WorkspaceNode[],
  parentId: NodeId | null,
  baseName: string,
): string {
  const existingNames = new Set(
    nodes.filter((node) => node.parentId === parentId).map((node) => node.name.toLowerCase()),
  )

  if (!existingNames.has(baseName.toLowerCase())) {
    return baseName
  }

  const extensionIndex = baseName.lastIndexOf(".")
  const stem = extensionIndex > 0 ? baseName.slice(0, extensionIndex) : baseName
  const extension = extensionIndex > 0 ? baseName.slice(extensionIndex) : ""
  let index = 2

  while (existingNames.has(`${stem} ${index}${extension}`.toLowerCase())) {
    index += 1
  }

  return `${stem} ${index}${extension}`
}

export function moveNodesToParent(request: MoveNodesRequest): MoveNodesResult {
  const selectedIds = uniqueNodeIds(request.selectedIds)
  if (selectedIds.length === 0) {
    return { kind: "invalid", message: "Choose a file or folder first." }
  }

  if (request.parentId !== null) {
    const target = findNode(request.nodes, request.parentId)
    if (target?.kind !== NodeKind.Folder) {
      return { kind: "invalid", message: "Choose a folder target." }
    }
  }

  for (const selectedId of selectedIds) {
    if (selectedId === request.parentId) {
      return { kind: "invalid", message: "Choose a different folder." }
    }
    if (request.parentId !== null && isDescendant(request.nodes, selectedId, request.parentId)) {
      return { kind: "invalid", message: "Cannot move into itself." }
    }
  }

  const topSelectedIds = selectedIds.filter(
    (selectedId) => !hasSelectedAncestor(request.nodes, selectedId, selectedIds),
  )
  const topSelectedIdSet = new Set(topSelectedIds)

  return {
    kind: "moved",
    movedIds: topSelectedIds,
    nodes: request.nodes.map((node) =>
      topSelectedIdSet.has(node.id)
        ? { ...node, parentId: request.parentId, updatedAt: request.updatedAt }
        : node,
    ),
  }
}

function buildChildren(
  nodes: readonly WorkspaceNode[],
  parentId: NodeId | null,
  sortOrder: TreeSortOrder,
): readonly TreeNode[] {
  return nodes
    .filter((node) => node.parentId === parentId)
    .sort((left, right) => compareNodes(left, right, sortOrder))
    .map((node) => ({
      ...node,
      children: buildChildren(nodes, node.id, sortOrder),
    }))
}

function compareNodes(left: WorkspaceNode, right: WorkspaceNode, sortOrder: TreeSortOrder): number {
  if (left.kind !== right.kind) {
    return left.kind === NodeKind.Folder ? -1 : 1
  }

  if (sortOrder === TreeSortOrder.Updated && left.updatedAt !== right.updatedAt) {
    return right.updatedAt - left.updatedAt
  }

  return left.name.localeCompare(right.name, undefined, { sensitivity: "base", numeric: true })
}

function uniqueNodeIds(ids: readonly NodeId[]): readonly NodeId[] {
  return Array.from(new Set(ids))
}

function hasSelectedAncestor(
  nodes: readonly WorkspaceNode[],
  nodeId: NodeId,
  selectedIds: readonly NodeId[],
): boolean {
  const selectedIdSet = new Set(selectedIds)
  let current = findNode(nodes, nodeId)

  while (current?.parentId !== null && current?.parentId !== undefined) {
    if (selectedIdSet.has(current.parentId)) {
      return true
    }
    current = findNode(nodes, current.parentId)
  }

  return false
}

export function collectDescendantIds(
  nodes: readonly WorkspaceNode[],
  parentId: NodeId,
): readonly NodeId[] {
  const directChildren = nodes.filter((node) => node.parentId === parentId)
  return directChildren.flatMap((node) => [node.id, ...collectDescendantIds(nodes, node.id)])
}

export function isDescendant(
  nodes: readonly WorkspaceNode[],
  ancestorId: NodeId,
  candidateId: NodeId,
): boolean {
  return collectDescendantIds(nodes, ancestorId).includes(candidateId)
}
